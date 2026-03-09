import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractUsername(url: string): string | null {
  // Handle formats like https://instagram.com/username or @username or just username
  const cleaned = url.trim().replace(/\/+$/, "");
  const match = cleaned.match(/(?:instagram\.com\/)([^/?#]+)/i);
  if (match) return match[1];
  // If it's just a handle
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

    // Verify user
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { platform, url: profileUrl } = await req.json();

    if (platform !== "instagram") {
      return new Response(JSON.stringify({ success: false, error: "Only Instagram is supported for auto-fetch currently." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const username = extractUsername(profileUrl);
    if (!username) {
      return new Response(JSON.stringify({ success: false, error: "Could not extract username from URL." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(JSON.stringify({ success: false, error: "Scraping service not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const socialBladeUrl = `https://socialblade.com/instagram/user/${username}`;
    console.log(`Scraping SocialBlade for @${username}: ${socialBladeUrl}`);

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: socialBladeUrl,
        formats: ["markdown"],
        onlyMainContent: false,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: "Could not fetch social stats. Try again later." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = scrapeData.data?.markdown || scrapeData.markdown || "";
    console.log("Scraped content length:", content.length);

    // Parse followers count from SocialBlade markdown
    // SocialBlade format: "followers\n\n23,373" or "followers\n\n23K"
    let followers: string | null = null;
    let engagementRate: string | null = null;

    // Try exact number format: "followers\n\n23,373"
    const followersMatch = content.match(/followers\s*\n\s*\n\s*([\d,]+)/i);
    if (followersMatch) {
      const num = parseInt(followersMatch[1].replace(/,/g, ""));
      if (num >= 1000000) {
        followers = (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
      } else if (num >= 1000) {
        followers = (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
      } else {
        followers = String(num);
      }
    }

    // Try engagement rate: "engagement rate\n\n4.08%"
    const erMatch = content.match(/engagement rate\s*\n\s*\n\s*([\d.]+)%/i);
    if (erMatch) {
      engagementRate = erMatch[1];
    }

    if (!followers) {
      console.log("Could not parse followers from content. First 500 chars:", content.substring(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: "Could not parse follower count from SocialBlade. The account may not be tracked." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Parsed stats for @${username}: followers=${followers}, engagement=${engagementRate}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          followers,
          engagement_rate: engagementRate,
          username,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fetch stats error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
