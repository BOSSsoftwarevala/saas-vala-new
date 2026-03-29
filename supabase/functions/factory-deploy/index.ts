import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getHeaders(token: string) {
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function respond(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Cloudflare DNS ───
async function createCloudflareDns(subdomain: string, targetIp: string) {
  const CF_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN");
  const CF_ZONE_ID = Deno.env.get("CLOUDFLARE_ZONE_ID");

  if (!CF_API_TOKEN || !CF_ZONE_ID) {
    return { success: false, error: "Cloudflare not configured" };
  }

  try {
    // Check if record already exists
    const listRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records?name=${subdomain}.saasvala.com&type=CNAME`,
      { headers: { "Authorization": `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" } }
    );
    const listData = await listRes.json();

    if (listData.result && listData.result.length > 0) {
      // Update existing
      const recordId = listData.result[0].id;
      const updateRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${recordId}`,
        {
          method: "PUT",
          headers: { "Authorization": `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "CNAME",
            name: subdomain,
            content: "cname.vercel-dns.com",
            proxied: true,
            ttl: 1,
          }),
        }
      );
      const updateData = await updateRes.json();
      return { success: updateData.success, action: "updated", record_id: recordId };
    }

    // Create new CNAME for Vercel
    const createRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CNAME",
          name: subdomain,
          content: "cname.vercel-dns.com",
          proxied: true,
          ttl: 1,
        }),
      }
    );
    const createData = await createRes.json();
    return { success: createData.success, action: "created", record_id: createData.result?.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Create A record pointing to VPS
async function createCloudflareARecord(subdomain: string, ip: string) {
  const CF_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN");
  const CF_ZONE_ID = Deno.env.get("CLOUDFLARE_ZONE_ID");

  if (!CF_API_TOKEN || !CF_ZONE_ID) {
    return { success: false, error: "Cloudflare not configured" };
  }

  try {
    const fullName = `${subdomain}.saasvala.com`;
    // Check existing
    const listRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records?name=${fullName}&type=A`,
      { headers: { "Authorization": `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" } }
    );
    const listData = await listRes.json();

    if (listData.result && listData.result.length > 0) {
      const recordId = listData.result[0].id;
      const updateRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${recordId}`,
        {
          method: "PUT",
          headers: { "Authorization": `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ type: "A", name: subdomain, content: ip, proxied: true, ttl: 1 }),
        }
      );
      const updateData = await updateRes.json();
      return { success: updateData.success, action: "updated", record_id: recordId };
    }

    const createRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "A", name: subdomain, content: ip, proxied: true, ttl: 1 }),
      }
    );
    const createData = await createRes.json();
    return { success: createData.success, action: "created", record_id: createData.result?.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

async function createVercelProject(headers: Record<string, string>, repoOwner: string, repoName: string, projectName: string) {
  const res = await fetch("https://api.vercel.com/v10/projects", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: projectName,
      framework: null,
      gitRepository: { type: "github", repo: `${repoOwner}/${repoName}` },
    }),
  });
  return res.json();
}

async function addCustomDomain(headers: Record<string, string>, projectId: string, domain: string) {
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: domain }),
  });
  return res.json();
}

async function triggerDeployment(headers: Record<string, string>, projectName: string, repoOwner: string, repoName: string) {
  const res = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: projectName,
      gitSource: { type: "github", ref: "main", repoId: `${repoOwner}/${repoName}` },
    }),
  });
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, app_name, repo_url, project_id, repos, domain_suffix, target_ip } = body;

    const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");

    switch (action) {
      // ─── Auto Subdomain with Cloudflare DNS ───
      case "auto-subdomain": {
        if (!repo_url) return respond({ success: false, error: "repo_url required" }, 400);

        const match = repo_url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
        if (!match) return respond({ success: false, error: "Invalid GitHub URL" }, 400);

        const [, owner, repo] = match;
        const projectName = slugify(app_name || repo);
        const suffix = domain_suffix || "saasvala.com";
        const customDomain = `${projectName}.${suffix}`;

        // Step 1: Create Cloudflare DNS record
        let dnsResult: any;
        if (target_ip) {
          // VPS mode: A record to IP
          dnsResult = await createCloudflareARecord(projectName, target_ip);
        } else {
          // Vercel mode: CNAME to vercel
          dnsResult = await createCloudflareDns(projectName, "cname.vercel-dns.com");
        }

        // Step 2: If Vercel token available, deploy to Vercel too
        let vercelResult: any = null;
        if (VERCEL_TOKEN && !target_ip) {
          const headers = getHeaders(VERCEL_TOKEN);
          const createData = await createVercelProject(headers, owner, repo, projectName);
          const vercelProjectId = createData.id || createData.error?.projectId;

          if (vercelProjectId) {
            await addCustomDomain(headers, vercelProjectId, customDomain);
            const deployData = await triggerDeployment(headers, projectName, owner, repo);
            vercelResult = {
              project_id: vercelProjectId,
              deployment_id: deployData.id,
              vercel_url: `https://${projectName}.vercel.app`,
            };
          }
        }

        return respond({
          success: true,
          custom_domain: customDomain,
          dns: dnsResult,
          vercel: vercelResult,
          deploy_url: `https://${customDomain}`,
          message: `✅ ${customDomain} created! DNS: ${dnsResult.action || 'configured'}`,
        });
      }

      // ─── Bulk Auto Subdomain ───
      case "bulk-subdomain": {
        const repoList: { slug: string; owner?: string }[] = repos || [];
        if (!repoList.length) return respond({ success: false, error: "repos array required" }, 400);

        const suffix = domain_suffix || "saasvala.com";
        const results: any[] = [];
        let successCount = 0;

        for (const r of repoList) {
          const projectName = slugify(r.slug);
          try {
            // Create Cloudflare DNS
            const dnsResult = await createCloudflareDns(projectName, "cname.vercel-dns.com");

            // Create Vercel project + domain if token available
            let vercelOk = false;
            if (VERCEL_TOKEN) {
              const headers = getHeaders(VERCEL_TOKEN);
              const owner = r.owner || "saasvala";
              const createData = await createVercelProject(headers, owner, r.slug, projectName);
              const pid = createData.id || createData.error?.projectId;
              if (pid) {
                await addCustomDomain(headers, pid, `${projectName}.${suffix}`);
                await triggerDeployment(headers, projectName, owner, r.slug);
                vercelOk = true;
              }
            }

            results.push({
              slug: r.slug,
              success: dnsResult.success || vercelOk,
              custom_domain: `${projectName}.${suffix}`,
              dns: dnsResult.action || "configured",
            });
            if (dnsResult.success || vercelOk) successCount++;
          } catch (e: any) {
            results.push({ slug: r.slug, success: false, error: e.message });
          }
        }

        return respond({
          success: true,
          total: repoList.length,
          created: successCount,
          failed: repoList.length - successCount,
          results,
          message: `✅ ${successCount}/${repoList.length} subdomains created`,
        });
      }

      // ─── Create DNS Only (Cloudflare) ───
      case "create-dns": {
        const subdomain = body.subdomain || slugify(app_name || "");
        const ip = body.ip || target_ip;

        if (!subdomain) return respond({ success: false, error: "subdomain required" }, 400);

        let result;
        if (ip) {
          result = await createCloudflareARecord(subdomain, ip);
        } else {
          result = await createCloudflareDns(subdomain, "cname.vercel-dns.com");
        }

        return respond({
          success: result.success,
          subdomain: `${subdomain}.saasvala.com`,
          dns: result,
          message: result.success ? `✅ DNS ${result.action} for ${subdomain}.saasvala.com` : `❌ ${result.error}`,
        });
      }

      // ─── Deploy (Vercel) ───
      case "deploy": {
        if (!VERCEL_TOKEN) return respond({ success: false, error: "VERCEL_TOKEN not configured" }, 500);
        if (!repo_url) return respond({ success: false, error: "repo_url required" }, 400);

        const match = repo_url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
        if (!match) return respond({ success: false, error: "Invalid GitHub URL" }, 400);

        const [, owner, repo] = match;
        const projectName = slugify(app_name || repo);
        const headers = getHeaders(VERCEL_TOKEN);

        const createData = await createVercelProject(headers, owner, repo, projectName);
        const vercelProjectId = createData.id || createData.error?.projectId;
        if (!vercelProjectId) return respond({ success: false, error: "Failed to create project", details: createData }, 400);

        const deployData = await triggerDeployment(headers, projectName, owner, repo);
        return respond({
          success: true,
          project_name: projectName,
          project_id: vercelProjectId,
          deploy_url: `https://${projectName}.vercel.app`,
          deployment_id: deployData.id,
          message: `✅ Deployed ${projectName}`,
        });
      }

      // ─── List Projects ───
      case "list": {
        if (!VERCEL_TOKEN) return respond({ success: false, error: "VERCEL_TOKEN not configured" }, 500);
        const res = await fetch("https://api.vercel.com/v9/projects?limit=50", { headers: getHeaders(VERCEL_TOKEN) });
        const data = await res.json();
        const projects = (data.projects || []).map((p: any) => ({
          name: p.name, id: p.id, url: `https://${p.name}.vercel.app`,
          framework: p.framework, updated: p.updatedAt,
        }));
        return respond({ success: true, projects, total: projects.length });
      }

      // ─── Health Check ───
      case "health": {
        const cfOk = !!(Deno.env.get("CLOUDFLARE_API_TOKEN") && Deno.env.get("CLOUDFLARE_ZONE_ID"));
        const vercelOk = !!VERCEL_TOKEN;
        return respond({ success: true, cloudflare: cfOk ? "connected" : "not configured", vercel: vercelOk ? "connected" : "not configured" });
      }

      default:
        return respond({ success: false, error: `Unknown action: ${action}` }, 400);
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});