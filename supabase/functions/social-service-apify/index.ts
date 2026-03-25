import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ApifyResult {
  username?: string;
  biography?: string; // Instagram
  full_text?: string; // Twitter
  description?: string; // YouTube
  followersCount?: number;
  followers_count?: number;
  subscribersCount?: number;
  engagementRate?: number;
}

function extractUsername(url: string): string | null {
  const cleaned = url.trim().replace(/\/+$/, "");
  const igMatch = cleaned.match(/(?:instagram\.com\/)([^/?#]+)/i);
  if (igMatch) return igMatch[1];
  const twMatch = cleaned.match(/(?:x\.com|twitter\.com)\/([^/?#]+)/i);
  if (twMatch) return twMatch[1];
  const ytMatch = cleaned.match(/(?:youtube\.com\/)(?:@|c\/|channel\/)?([^/?#]+)/i);
  if (ytMatch) return ytMatch[1];
  return cleaned.replace(/^@/, "") || null;
}

function constructUrl(platform: string, input: string): string {
  const username = extractUsername(input);
  if (!username) return input;
  switch (platform) {
    case "instagram": return `https://instagram.com/${username}`;
    case "twitter": return `https://x.com/${username}`;
    case "youtube": return `https://youtube.com/@${username}`;
    default: return input;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apifyToken = Deno.env.get("APIFY_TOKEN");

    if (!supabaseUrl || !supabaseKey || !apifyToken) {
      return new Response(JSON.stringify({ success: false, error: "Server configuration error (missing tokens)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = authData.user;

    const { platform, url: socialUrl, verificationCode: manualCode, action = "verify" } = await req.json();

    if (!platform || !socialUrl) {
      return new Response(JSON.stringify({ success: false, error: "Platform and Handle are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const username = extractUsername(socialUrl);
    if (!username) {
      return new Response(JSON.stringify({ success: false, error: "Invalid handle" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Determine Actor and Input
    let actorId = "";
    let input: any = {};

    if (platform === "instagram") {
      actorId = "bGApZ3CtTxA9fv2rl"; // coderx/instagram-profile-scraper-api
      input = {
        usernames: [username]
      };
    } else if (platform === "twitter") {
      actorId = "TKLtfBQ02rrtQYmUa"; // User recommended X scraper
      input = {
        mode: "Get User by Username",
        username: username,
        max_results: 1
      };
    } else if (platform === "youtube") {
      actorId = "67Q6fmd8iedTVcCwY"; // User recommended YouTube scraper
      input = { 
        startUrls: [{ url: `https://www.youtube.com/@${username}` }],
        maxResults: 1,
        maxResultsShorts: 0,
        maxResultStreams: 0
      };
    } else {
      throw new Error(`Platform ${platform} not supported via Apify yet.`);
    }

    console.log(`[Apify] Starting run for ${platform} / ${username} with actor ${actorId}`);
    console.log(`[Apify] Input: ${JSON.stringify(input)}`);

    // 2. Start Actor Run and Wait (max 60s)
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}&wait=60`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error(`[Apify] Run creation failed: ${errorText}`);
      throw new Error(`Apify Run Error (${runResponse.status}): ${errorText}`);
    }

    let runData = await runResponse.json();
    let runId = runData.data.id;
    let status = runData.data.status;
    console.log(`[Apify] Initial Run ID: ${runId}, Status: ${status}`);

    // 2. Poll for completion (max 50 seconds)
    const startTime = Date.now();
    const maxPollTime = 50000; // 50s

    while (status !== "SUCCEEDED" && status !== "FAILED" && status !== "ABORTED" && status !== "TIMED-OUT") {
      if (Date.now() - startTime > maxPollTime) {
        console.warn(`[Apify] Polling timed out after ${maxPollTime}ms. Current status: ${status}`);
        break;
      }

      console.log(`[Apify] Run ${runId} is ${status}. Waiting 3s...`);
      await new Promise(resolve => setTimeout(resolve, 3000));

      const pollResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
      if (pollResponse.ok) {
        const pollData = await pollResponse.json();
        status = pollData.data.status;
        runData = pollData; // Update runData with latest stats
      } else {
        console.error(`[Apify] Poll failed: ${pollResponse.status}`);
      }
    }

    console.log(`[Apify] Final Run Status: ${status}`);

    if (status === "FAILED" || status === "ABORTED") {
      throw new Error(`Apify Run failed with status: ${status}. Message: ${runData.data.statusMessage || "None"}`);
    }

    const datasetId = runData.data.defaultDatasetId;
    if (!datasetId) {
      throw new Error("Apify Run did not produce a defaultDatasetId.");
    }

    // 3. Fetch Dataset Results
    console.log(`[Apify] Fetching dataset: ${datasetId}`);
    const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}&clean=true`);
    const items = await datasetResponse.json() as any[];

    console.log(`[Apify] Received ${items.length} items from dataset`);

    if (items.length === 0) {
      const statusMessage = runData.data?.statusMessage || "No additional status message.";
      return new Response(JSON.stringify({
        success: false,
        error: `No results found on ${platform} for handle: ${username}. Ensure the profile is public.`,
        details: `Run Status: ${status}. Msg: ${statusMessage}`
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = items[0];
    console.log(`[Apify] Raw Item Keys: ${Object.keys(result).join(", ")}`);

    // --- BRUTE FORCE EXTRACTION ---
    let bioText = "";
    let followersCount = 0;

    // 1. Try known fields first
    bioText = result.biography || result.full_text || result.description || (result as any).channelDescription || (result as any).biographyText || (result as any).bio || (result as any).about || (result as any).descriptionText || (result as any).user?.description || (result as any).legacy?.description || (result as any).channel?.description || "";
    followersCount = result.followersCount || result.followers_count || result.subscribersCount || (result as any).numberOfSubscribers || (result as any).channelSubscribers || (result as any).subscriberCount || (result as any).followerCount || (result as any).followers || (result as any).totalFollowers || (result as any).user?.followers_count || (result as any).legacy?.followers_count || (result as any).channel?.subscriberCount || (result as any).channel?.subscribers || 0;

    // 2. Brute force scan all keys if still empty/zero
    if (!bioText || followersCount === 0) {
      console.log("[Apify] Known fields yielded no data. Brute forcing all keys...");
      for (const [key, value] of Object.entries(result)) {
        if (!bioText && typeof value === "string" && (key.toLowerCase().includes("desc") || key.toLowerCase().includes("bio") || key.toLowerCase().includes("about") || key.toLowerCase().includes("text"))) {
          bioText = value;
          console.log(`[Apify] Brute-forced bioText from key: ${key}`);
        }
        if (followersCount === 0 && (typeof value === "number" || typeof value === "string") && (key.toLowerCase().includes("subscriber") || key.toLowerCase().includes("follower"))) {
          const numValue = typeof value === "string" ? parseInt(value.replace(/[^0-9]/g, "")) : value;
          if (!isNaN(numValue)) {
            followersCount = numValue;
            console.log(`[Apify] Brute-forced followersCount from key: ${key}`);
          }
        }
        // Deep scan nested objects (one level)
        if (typeof value === "object" && value !== null) {
          for (const [subKey, subValue] of Object.entries(value)) {
            if (!bioText && typeof subValue === "string" && subKey.toLowerCase().includes("desc")) {
              bioText = subValue;
              console.log(`[Apify] Brute-forced bioText from nested key: ${key}.${subKey}`);
            }
          }
        }
      }
    }

    const engagementRate = result.engagementRate || (result as any).engagementRatePct || (result as any).engagement || 0;
    console.log(`[Apify] Parsed: Followers=${followersCount}, BioLength=${bioText?.length || 0}`);

    // Format followers nicely (e.g., 23.4K)
    function formatFollowers(num: number): string {
      if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
      if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
      return String(num);
    }

    function parseFormattedFollowers(val: string | number | undefined | null): number {
      if (!val) return 0;
      if (typeof val === "number") return val;
      if (typeof val !== "string") return 0;
      const str = val.toLowerCase().trim();
      const multiplier = str.endsWith("m") ? 1000000 : str.endsWith("k") ? 1000 : 1;
      const numericPart = str.replace(/[km,]/g, "");
      const parsed = parseFloat(numericPart);
      return isNaN(parsed) ? 0 : Math.round(parsed * multiplier);
    }

    const formattedFollowers = formatFollowers(followersCount);

    if (action === "verify") {
      let verificationCode = manualCode;

      // Fetch verification code from DB if not provided
      if (!verificationCode) {
        const { data: profile } = await supabaseAdmin
          .from("influencer_profiles")
          .select("verification_code")
          .eq("user_id", user.id)
          .maybeSingle();
        verificationCode = profile?.verification_code;
      }

      if (!verificationCode) {
        throw new Error("Verification code not found in request or database.");
      }

      const verified = bioText && bioText.toLowerCase().includes(verificationCode.toLowerCase());
      console.log(`[Verify] Result: ${verified} (Searching for ${verificationCode} in bio)`);

      if (verified) {
        const urlColumn = platform === "instagram" ? "instagram_url" : platform === "youtube" ? "youtube_url" : "twitter_url";
        const followersCol = platform === "instagram" ? "ig_followers" : platform === "youtube" ? "yt_subscribers" : "twitter_followers";
        const engagementCol = platform === "instagram" ? "ig_engagement" : platform === "youtube" ? "yt_engagement" : "twitter_engagement";
        const verifiedCol = platform === "instagram" ? "ig_last_verified" : platform === "youtube" ? "yt_last_verified" : "twitter_last_verified";

        const fullUrl = constructUrl(platform, socialUrl);
        console.log(`[Apify] Updating ${platform} stats: followers=${followersCount}, engagement=${engagementRate}`);

        // 1. Fetch current profile to calculate TOTAL reach across all platforms
        const { data: currentProfile } = await supabaseAdmin
          .from("influencer_profiles")
          .select("ig_followers, yt_subscribers, twitter_followers")
          .eq("user_id", user.id)
          .maybeSingle();

        // Use the new count for the current platform, robustly parse existing ones
        const igCount = platform === "instagram" ? followersCount : parseFormattedFollowers(currentProfile?.ig_followers);
        const ytCount = platform === "youtube" ? followersCount : parseFormattedFollowers(currentProfile?.yt_subscribers);
        const twCount = platform === "twitter" ? followersCount : parseFormattedFollowers(currentProfile?.twitter_followers);
        
        const totalReach = igCount + ytCount + twCount;
        const formattedTotal = formatFollowers(totalReach);

        // 2. Update Profile (Specific platform columns + calculated total reach)
        const { data: profile, error: updateError } = await supabaseAdmin
          .from("influencer_profiles")
          .update({
            [urlColumn]: fullUrl,
            is_verified: true,
            followers: formattedTotal, // Update the legacy 'Total Reach' column with the calculated sum
            [followersCol]: followersCount,
            [engagementCol]: engagementRate > 0 ? parseFloat(engagementRate.toFixed(2)) : null,
            [verifiedCol]: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .select("id")
          .single();

        if (updateError) throw new Error(`Database Update Error: ${updateError.message}`);

        // 2. Log History Snapshot (Using the snapshot_data jsonb)
        const { error: historyError } = await supabaseAdmin
          .from("influencer_stats_history")
          .insert({
            influencer_id: profile.id,
            platform: platform,
            follower_count: followersCount,
            engagement_rate: engagementRate > 0 ? parseFloat(engagementRate.toFixed(2)) : null,
            snapshot_data: result // Save the full raw item for future analytics
          });

        if (historyError) {
          console.error("[Apify] History Log Error:", historyError.message);
          // Don't fail the verification if just the history log fails
        }

        return new Response(JSON.stringify({ 
          success: true, 
          verified: true, 
          stats: { 
            followers: formattedFollowers, // Platform-specific formatted string
            totalFollowers: formattedTotal, // The new calculated total formatted string
            engagementRate 
          }, 
          fullUrl 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({
          success: true,
          verified: false,
          message: `Verification code "${verificationCode}" was not found in your bio. Please add it and try again.`,
          stats: { followers: formattedFollowers },
          debug: {
            detectedKeys: Object.keys(result),
            bioSnippet: bioText ? bioText.substring(0, 100) : "empty",
            rawItem: JSON.stringify(result).substring(0, 300) + "..."
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({ success: true, stats: { followers: formattedFollowers, engagementRate } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("Critical Apify Service Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
