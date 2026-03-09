import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractUsername(url: string): string | null {
  const cleaned = url.trim().replace(/\/+$/, "");
  const match = cleaned.match(/(?:instagram\.com\/)([^/?#]+)/i);
  if (match) return match[1];
  return cleaned.replace(/^@/, "") || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ success: false, error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { platform, url: socialUrl } = await req.json();

    if (!platform || !socialUrl) {
      return new Response(JSON.stringify({ success: false, error: "Platform and URL are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's verification code
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("influencer_profiles")
      .select("verification_code")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ success: false, error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verificationCode = profile.verification_code;

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(JSON.stringify({ success: false, error: "Scraping service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let content = "";
    let followers: string | null = null;
    let engagementRate: string | null = null;

    if (platform === "instagram") {
      const username = extractUsername(socialUrl);
      if (!username) {
        return new Response(JSON.stringify({ success: false, error: "Could not extract username from URL." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Step 1: Scrape imginn.com for bio (verification code check) + followers
      const imginnUrl = `https://imginn.com/${username}/`;
      console.log(`Scraping imginn for @${username}: ${imginnUrl}`);

      const imginnResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: imginnUrl, formats: ["markdown"], onlyMainContent: false }),
      });

      const imginnData = await imginnResponse.json();

      if (!imginnResponse.ok) {
        console.error("Firecrawl imginn error:", imginnData);
        return new Response(
          JSON.stringify({ success: false, error: "Could not access profile. Make sure the username is correct and the profile is public." }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      content = imginnData.data?.markdown || imginnData.markdown || "";
      console.log("imginn content length:", content.length);

      // Parse followers from imginn: "23.4K\n\nfollowers" pattern
      const followersMatch = content.match(/([\d,.]+[KMB]?)\s*\n\s*\n?\s*followers/i);
      if (followersMatch) {
        followers = followersMatch[1];
        console.log("Parsed followers from imginn:", followers);
      }

      // Step 2: Also scrape SocialBlade for engagement rate
      const socialBladeUrl = `https://socialblade.com/instagram/user/${username}`;
      console.log(`Scraping SocialBlade for engagement: ${socialBladeUrl}`);

      try {
        const sbResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: socialBladeUrl, formats: ["markdown"], onlyMainContent: false }),
        });

        if (sbResponse.ok) {
          const sbData = await sbResponse.json();
          const sbContent = sbData.data?.markdown || sbData.markdown || "";
          const erMatch = sbContent.match(/engagement rate\s*\n\s*\n\s*([\d.]+)%/i);
          if (erMatch) {
            engagementRate = erMatch[1];
            console.log("Parsed engagement rate from SocialBlade:", engagementRate);
          }
          // Also get more precise follower count from SocialBlade
          const sbFollowersMatch = sbContent.match(/followers\s*\n\s*\n\s*([\d,]+)/i);
          if (sbFollowersMatch) {
            const num = parseInt(sbFollowersMatch[1].replace(/,/g, ""));
            if (num >= 1000000) {
              followers = (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
            } else if (num >= 1000) {
              followers = (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
            } else {
              followers = String(num);
            }
            console.log("Updated followers from SocialBlade:", followers);
          }
        }
      } catch (e) {
        console.log("SocialBlade scrape failed (non-critical):", e);
      }
    } else if (platform === "twitter") {
      // X/Twitter - use nitter.net as a proxy (x.com blocks direct scraping)
      const twitterUsername = socialUrl.match(/(?:x\.com|twitter\.com)\/([^/?#]+)/i)?.[1];
      if (!twitterUsername) {
        return new Response(JSON.stringify({ success: false, error: "Could not extract username from URL." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const nitterUrl = `https://nitter.net/${twitterUsername}`;
      console.log(`Scraping nitter.net for @${twitterUsername}: ${nitterUrl}`);

      const nitterResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: nitterUrl, formats: ["markdown"], onlyMainContent: false }),
      });

      const nitterData = await nitterResponse.json();

      if (!nitterResponse.ok) {
        console.error("Firecrawl nitter error:", nitterData);
        return new Response(
          JSON.stringify({ success: false, error: "Could not access profile. Make sure the username is correct and the profile is public." }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      content = nitterData.data?.markdown || nitterData.markdown || "";
      console.log("nitter content length:", content.length);

      // Parse followers from nitter: "Followers40" or "Followers\n40" pattern
      const nitterFollowersMatch = content.match(/Followers\s*(\d[\d,]*)/i);
      if (nitterFollowersMatch) {
        const num = parseInt(nitterFollowersMatch[1].replace(/,/g, ""));
        if (num >= 1000000) {
          followers = (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
        } else if (num >= 1000) {
          followers = (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
        } else {
          followers = String(num);
        }
        console.log("Parsed Twitter followers from nitter:", followers);
      }
    } else {
      // YouTube - use Firecrawl directly
      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: socialUrl, formats: ["markdown"], onlyMainContent: false }),
      });

      const scrapeData = await scrapeResponse.json();

      if (!scrapeResponse.ok) {
        console.error("Firecrawl error:", scrapeData);
        return new Response(
          JSON.stringify({ success: false, error: "Could not access the social profile. Make sure the URL is correct and the profile is public." }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      content = scrapeData.data?.markdown || scrapeData.markdown || "";
    }

    // Check if verification code exists in the scraped content
    const codeFound = content.toLowerCase().includes(verificationCode.toLowerCase());

    if (codeFound) {
      // Mark as verified and save the URL + stats
      const urlColumn = platform === "instagram" ? "instagram_url" : platform === "youtube" ? "youtube_url" : "twitter_url";
      
      const updateData: Record<string, any> = { [urlColumn]: socialUrl, is_verified: true };
      if (followers) updateData.followers = followers;
      if (engagementRate) updateData.engagement_rate = engagementRate;

      await supabaseAdmin
        .from("influencer_profiles")
        .update(updateData)
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true, verified: true, stats: { followers, engagement_rate: engagementRate } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          verified: false,
          message: "Verification code not found in your bio. Make sure you've added it and the profile is public.",
          stats: { followers, engagement_rate: engagementRate },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
