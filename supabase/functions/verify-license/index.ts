import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { license_key, device_id, app_signature, user_id } = await req.json();

    // FIXED: Validate inputs properly
    if (!license_key || typeof license_key !== 'string' || license_key.trim().length === 0) {
      return new Response(
        JSON.stringify({ status: "invalid", reason: "license_key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // FIXED: Prevent injection attacks
    if (license_key.length > 100) {
      return new Response(
        JSON.stringify({ status: "invalid", reason: "Invalid license key format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // 1. Find license record - FIXED: Add user_id filter
    const { data: download, error } = await adminClient
      .from("apk_downloads")
      .select("*")
      .eq("license_key", license_key)
      .eq("user_id", user_id || '')
      .single();

    if (error || !download) {
      // Log invalid attempt
      await adminClient.from("license_verification_logs").insert({
        license_key,
        device_id: device_id || null,
        app_signature: app_signature || null,
        user_id: user_id || null,
        result: "invalid",
        reason: "License key not found",
        ip_address: ip,
        attempted_at: new Date().toISOString()
      }).catch(() => {}); // Non-critical

      return new Response(
        JSON.stringify({ status: "invalid", reason: "License key not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // FIXED: Verify user ownership if provided
    if (user_id && download.user_id !== user_id) {
      await adminClient.from("license_verification_logs").insert({
        license_key,
        device_id: device_id || null,
        app_signature: app_signature || null,
        user_id: user_id,
        result: "unauthorized",
        reason: "User does not own this license",
        ip_address: ip,
        attempted_at: new Date().toISOString()
      }).catch(() => {});

      return new Response(
        JSON.stringify({ status: "invalid", reason: "Unauthorized access" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check if blocked
    if (download.is_blocked) {
      await adminClient.from("license_verification_logs").insert({
        license_key,
        device_id: device_id || null,
        app_signature: app_signature || null,
        user_id: download.user_id,
        result: "blocked",
        reason: download.blocked_reason || "License revoked",
        ip_address: ip,
        attempted_at: new Date().toISOString()
      }).catch(() => {});

      return new Response(
        JSON.stringify({ status: "blocked", reason: download.blocked_reason || "License revoked" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // FIXED: Check expiration
    if (download.expires_at && new Date(download.expires_at) < new Date()) {
      await adminClient.from("license_verification_logs").insert({
        license_key,
        device_id: device_id || null,
        app_signature: app_signature || null,
        user_id: download.user_id,
        result: "expired",
        reason: "License expired",
        ip_address: ip,
        attempted_at: new Date().toISOString()
      }).catch(() => {});

      return new Response(
        JSON.stringify({ status: "expired", reason: "License has expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Device binding check - FIXED: Safer operations
    if (device_id && typeof device_id === 'string' && device_id.length > 0) {
      const existingDevice = download.device_info?.device_id;

      if (existingDevice && typeof existingDevice === 'string' && existingDevice !== device_id) {
        // Already bound to a different device
        const existingShort = existingDevice.substring(0, 8);
        const deviceShort = device_id.substring(0, 8);
        
        await adminClient.from("license_verification_logs").insert({
          license_key,
          device_id,
          app_signature: app_signature || null,
          user_id: download.user_id,
          result: "wrong_device",
          reason: `Bound to device ${existingShort}..., attempted from ${deviceShort}...`,
          ip_address: ip,
          attempted_at: new Date().toISOString()
        }).catch(() => {});

        return new Response(
          JSON.stringify({
            status: "invalid",
            reason: "License is bound to a different device. Contact support.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Bind device on first use or update attempts
      const updatePayload: any = {
        verification_attempts: (download.verification_attempts || 0) + 1,
        last_verified_at: new Date().toISOString()
      };

      if (!existingDevice) {
        updatePayload.device_info = { 
          device_id, 
          app_signature: app_signature || null, 
          bound_at: new Date().toISOString() 
        };
      }

      const { error: updateError } = await adminClient
        .from("apk_downloads")
        .update(updatePayload)
        .eq("id", download.id);

      if (updateError) {
        console.error("Update error:", updateError);
        // Don't fail verification on update error
      }
    } else {
      // No device_id, just update attempts
      await adminClient
        .from("apk_downloads")
        .update({
          verification_attempts: (download.verification_attempts || 0) + 1,
          last_verified_at: new Date().toISOString()
        })
        .eq("id", download.id)
        .catch(() => {});
    }

    // 4. Log valid verification
    await adminClient.from("license_verification_logs").insert({
      license_key,
      device_id: device_id || null,
      app_signature: app_signature || null,
      user_id: download.user_id,
      result: "valid",
      reason: "License verified successfully",
      ip_address: ip,
      attempted_at: new Date().toISOString()
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        status: "valid",
        user_id: download.user_id,
        product_id: download.product_id,
        bound_device: download.device_info?.device_id || device_id || null,
        verified_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Verification error:", err);
    return new Response(
      JSON.stringify({ status: "error", reason: "Internal verification error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
