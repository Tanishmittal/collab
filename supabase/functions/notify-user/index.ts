import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  user_id?: string;
  segment?: 'all' | 'influencers' | 'brands';
  city?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { user_id, segment, city, title, body, data } = await req.json() as PushPayload;

    if (!title || !body || (!user_id && !segment)) {
      return new Response(JSON.stringify({ error: "Missing required fields (title, body, and either user_id or segment)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get targets (FCM tokens)
    let tokens: string[] = [];

    if (user_id) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("fcm_token, notifications_enabled")
        .eq("user_id", user_id)
        .single();

      if (!profileError && profile?.fcm_token && profile.notifications_enabled) {
        tokens = [profile.fcm_token];
      }
    } else {
      // Broadcast mode
      let query = supabaseAdmin
        .from("profiles")
        .select("fcm_token")
        .not("fcm_token", "is", null)
        .eq("notifications_enabled", true);

      if (segment === 'influencers') {
        query = query.eq('user_type', 'influencer');
      } else if (segment === 'brands') {
        query = query.eq('user_type', 'brand');
      }

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      const { data: profiles, error: broadcastError } = await query;
      if (broadcastError) throw broadcastError;
      tokens = profiles?.map(p => p.fcm_token).filter(Boolean) as string[] || [];
    }

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ success: false, message: "No target tokens found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Obtain OAuth2 token for Firebase via Service Account
    const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT")!);
    
    // Format private key correctly (replace \n with actual newlines)
    const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

    // Create JWT for Google OAuth2
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/cloud-platform",
    };

    // Import the private key for signing
    const pemContents = privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, "");
    const binaryKey = Buffer.from(pemContents, "base64");
    
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const jwt = await djwt.create({ alg: "RS256", typ: "JWT" }, jwtPayload, cryptoKey);

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const { access_token } = await tokenResponse.json();
    
    if (!access_token) {
      throw new Error("Failed to obtain OAuth2 access token");
    }

    // 3. Post to FCM V1 for each token
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;
    let successCount = 0;
    let failureCount = 0;

    for (const token of tokens) {
      try {
        const fcmResponse = await fetch(fcmUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: token,
              notification: { title, body },
              data: data || {},
              android: {
                priority: "high",
                notification: {
                  sound: "default",
                  click_action: "TOP_LEVEL_NAV",
                }
              },
              apns: {
                payload: {
                  aps: {
                    sound: "default",
                    badge: 1
                  }
                }
              }
            },
          }),
        });

        if (fcmResponse.ok) {
          successCount++;
        } else {
          const errData = await fcmResponse.json();
          console.error(`FCM error for token ${token.substring(0, 10)}...:`, errData);
          failureCount++;
        }
      } catch (e) {
        console.error("Fetch error during FCM loop:", e);
        failureCount++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount,
      failed: failureCount,
      total: tokens.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Push Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
