import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  user_id: string;
  type: 'profile_hidden' | 'campaign_hidden';
  reason: string;
  items?: string[]; // Names of campaigns or "Your Profile"
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const { user_id, type, reason, items }: EmailPayload = await req.json();

    if (!user_id || !type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get User Email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (userError || !userData.user?.email) {
      throw new Error(`Could not find email for user ${user_id}`);
    }

    const email = userData.user.email;
    const name = userData.user.user_metadata?.display_name || "User";

    // 2. Prepare Template
    let subject = "";
    let html = "";

    if (type === 'profile_hidden') {
      subject = "Important: Your profile visibility has been updated";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
          <h2 style="color: #1e293b;">Hi ${name},</h2>
          <p style="color: #475569; line-height: 1.6;">Your profile visibility has been updated by our moderation team. Your profile is currently hidden from public discovery.</p>
          <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #991b1b; display: block; margin-bottom: 5px;">Reason for Moderation:</strong>
            <p style="color: #b91c1c; margin: 0;">${reason || "Your profile requires updates to meet our community standards."}</p>
          </div>
          <p style="color: #475569;">Please log in to your dashboard to resolve these issues and request a review.</p>
          <a href="https://influgal.com/dashboard" style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Go to Dashboard</a>
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #94a3b8;">Team Influgal</p>
        </div>
      `;
    } else if (type === 'campaign_hidden') {
      const itemCount = items?.length || 1;
      subject = `Important: ${itemCount > 1 ? itemCount + ' Campaigns' : 'one of your campaigns'} has been hidden`;

      const itemListHtml = items && items.length > 0
        ? `<ul style="color: #475569;">${items.map(item => `<li>${item}</li>`).join('')}</ul>`
        : "";

      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
          <h2 style="color: #1e293b;">Hi ${name},</h2>
          <p style="color: #475569; line-height: 1.6;">Our moderation team has hidden ${itemCount > 1 ? 'multiple campaigns' : 'a campaign'} from your Brand Workspace.</p>
          ${itemListHtml}
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #92400e; display: block; margin-bottom: 5px;">Reason for Moderation:</strong>
            <p style="color: #b45309; margin: 0;">${reason || "The content requires updates to meet our guidelines."}</p>
          </div>
          <p style="color: #475569;">Hidden campaigns are not visible to creators. Please review and update them to restore visibility.</p>
          <a href="https://influgal.com/brand/campaigns" style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Review Campaigns</a>
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #94a3b8;">Team Influgal</p>
        </div>
      `;
    }

    // 3. Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: 'Influgal Moderation <moderation@api.influgal.com>',
        to: [email],
        subject: subject,
        html: html,
      }),
    });

    const resData = await res.json();

    // 4. Log the result
    await supabaseAdmin.from('notification_logs').insert({
      user_id: user_id,
      recipient_email: email,
      notification_type: type,
      status: res.ok ? 'success' : 'failed',
      error_message: res.ok ? null : JSON.stringify(resData),
      items: items || null
    });

    if (!res.ok) throw new Error(JSON.stringify(resData));

    return new Response(JSON.stringify({ success: true, id: resData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Email Error:", err);

    // Attempt to log error if possible (re-creating client in catch scope if needed)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

      const body = await req.clone().json().catch(() => ({}));
      if (body.user_id) {
        await supabaseAdmin.from('notification_logs').insert({
          user_id: body.user_id,
          recipient_email: "Unknown (Error during fetch)",
          notification_type: body.type || "unknown",
          status: 'failed',
          error_message: err.message
        });
      }
    } catch (logErr) {
      console.error("Logging Error:", logErr);
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
