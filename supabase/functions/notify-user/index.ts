import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  user_id?: string;
  segment?: 'all' | 'influencers' | 'brands' | 'needs_profile';
  city?: string;
  title: string;
  body: string;
  message?: string;
  action_url?: string;
  data?: Record<string, string>;
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim() || null;
}

function normalizePayload(raw: unknown): PushPayload {
  const source =
    raw && typeof raw === "object" && "body" in raw && raw.body && typeof raw.body === "object"
      ? raw.body
      : raw;

  const payload = (source ?? {}) as Record<string, unknown>;
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const bodySource =
    typeof payload.body === "string"
      ? payload.body
      : typeof payload.message === "string"
        ? payload.message
        : "";
  const body = bodySource.trim();

  return {
    user_id: typeof payload.user_id === "string" ? payload.user_id : undefined,
    segment:
      payload.segment === "all" ||
      payload.segment === "influencers" ||
      payload.segment === "brands" ||
      payload.segment === "needs_profile"
        ? payload.segment
        : undefined,
    city: typeof payload.city === "string" && payload.city.trim() ? payload.city.trim() : undefined,
    title,
    body,
    action_url: typeof payload.action_url === "string" && payload.action_url.trim() ? payload.action_url.trim() : undefined,
    data:
      payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
        ? (payload.data as Record<string, string>)
        : undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const bearerToken = getBearerToken(req);

    const rawPayload = await req.json();
    const { user_id, segment, city, title, body, action_url, data } = normalizePayload(rawPayload);

    if (!title || !body || (!user_id && !segment)) {
      return new Response(JSON.stringify({
        error: "Missing required fields (title, body, and either user_id or segment)",
        received: {
          has_user_id: Boolean(user_id),
          segment: segment ?? null,
          has_title: Boolean(title),
          has_body: Boolean(body),
        },
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Broadcast mode writes notification rows for the matched audience.
    // The existing DB trigger then calls this function again in single-user mode,
    // which sends push notifications and also lets web clients receive realtime updates.
    if (!user_id && segment) {
      if (!bearerToken) {
        return new Response(JSON.stringify({ error: "Missing authorization token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.getUser(bearerToken);
      if (authUserError || !authUserData.user) {
        return new Response(JSON.stringify({ error: "Invalid or expired user session" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from("admin_profiles")
        .select("id")
        .eq("user_id", authUserData.user.id)
        .maybeSingle();

      if (adminError) throw adminError;
      if (!adminProfile) {
        return new Response(JSON.stringify({ error: "Only admins can send broadcasts" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let audienceQuery = supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("notifications_enabled", true);

      if (segment === 'influencers') {
        audienceQuery = audienceQuery.eq('user_type', 'influencer');
      } else if (segment === 'brands') {
        audienceQuery = audienceQuery.eq('user_type', 'brand');
      }

      if (city) {
        audienceQuery = audienceQuery.ilike('city', `%${city}%`);
      }

      const { data: audience, error: audienceError } = await audienceQuery;
      if (audienceError) throw audienceError;

      let userIds = [...new Set((audience ?? []).map((profile) => profile.user_id).filter(Boolean))];

      if (segment === 'needs_profile' && userIds.length > 0) {
        const [{ data: influencerProfiles, error: influencerError }, { data: brandProfiles, error: brandError }] = await Promise.all([
          supabaseAdmin
            .from("influencer_profiles")
            .select("user_id")
            .in("user_id", userIds),
          supabaseAdmin
            .from("brand_profiles")
            .select("user_id")
            .in("user_id", userIds),
        ]);

        if (influencerError) throw influencerError;
        if (brandError) throw brandError;

        const completedProfileUserIds = new Set([
          ...(influencerProfiles ?? []).map((profile) => profile.user_id),
          ...(brandProfiles ?? []).map((profile) => profile.user_id),
        ]);

        userIds = userIds.filter((targetUserId) => !completedProfileUserIds.has(targetUserId));
      }

      if (userIds.length === 0) {
        return new Response(JSON.stringify({ success: false, message: "No target users found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const notificationRows = userIds.map((targetUserId) => ({
        user_id: targetUserId,
        type: "broadcast",
        title,
        body,
        action_url: action_url ?? data?.action_url ?? null,
        metadata: {
          source: "admin_broadcast",
          segment,
          city: city ?? null,
          ...data,
        },
      }));

      const { error: insertError } = await supabaseAdmin
        .from("notifications")
        .insert(notificationRows);

      if (insertError) throw insertError;

      const { error: broadcastInsertError } = await supabaseAdmin
        .from("admin_broadcasts")
        .insert({
          created_by: authUserData.user.id,
          segment,
          city: city ?? null,
          title,
          body,
          recipient_count: userIds.length,
          sent_count: userIds.length,
          failed_count: 0,
          metadata: {
            action_url: action_url ?? data?.action_url ?? null,
            mode: "broadcast_notifications",
            ...data,
          },
        });

      if (broadcastInsertError) throw broadcastInsertError;

      return new Response(JSON.stringify({
        success: true,
        sent: userIds.length,
        failed: 0,
        total: userIds.length,
        mode: "broadcast_notifications",
      }), {
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
