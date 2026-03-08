import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, app_name, repo_url, project_id } = await req.json();

    const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN");

    if (!VERCEL_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: "Vercel not configured. Set VERCEL_TOKEN secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers = {
      "Authorization": `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    };

    switch (action) {
      case "deploy": {
        // Create a new Vercel project from a GitHub repo
        if (!repo_url) {
          return new Response(
            JSON.stringify({ success: false, error: "repo_url is required for deploy" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Parse GitHub URL → owner/repo
        const match = repo_url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
        if (!match) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid GitHub URL. Expected: https://github.com/owner/repo" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const [, owner, repo] = match;
        const projectName = app_name || repo;

        // Step 1: Create or get project
        const createRes = await fetch("https://api.vercel.com/v10/projects", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            framework: null,
            gitRepository: {
              type: "github",
              repo: `${owner}/${repo}`,
            },
          }),
        });

        const createData = await createRes.json();

        if (!createRes.ok && createData.error?.code !== "project_already_exists") {
          return new Response(
            JSON.stringify({ success: false, error: createData.error?.message || "Failed to create Vercel project", details: createData }),
            { status: createRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const vercelProjectId = createData.id || createData.error?.projectId;
        const deployUrl = `https://${projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.vercel.app`;

        // Step 2: Trigger deployment via Vercel Deploy Hook or just return project info
        // Vercel auto-deploys on git push when connected. For manual trigger:
        const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            gitSource: {
              type: "github",
              ref: "main",
              repoId: `${owner}/${repo}`,
            },
          }),
        });

        const deployData = await deployRes.json();

        return new Response(
          JSON.stringify({
            success: true,
            method: "vercel",
            project_name: projectName,
            project_id: vercelProjectId,
            deploy_url: deployData.url ? `https://${deployData.url}` : deployUrl,
            deployment_id: deployData.id,
            status: deployData.readyState || "queued",
            message: `✅ Deployed ${projectName} to Vercel → ${deployData.url ? `https://${deployData.url}` : deployUrl}`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list": {
        const res = await fetch("https://api.vercel.com/v9/projects?limit=50", { headers });
        const data = await res.json();
        const projects = (data.projects || []).map((p: any) => ({
          name: p.name,
          id: p.id,
          url: `https://${p.name}.vercel.app`,
          framework: p.framework,
          updated: p.updatedAt,
          repo: p.link?.repo,
        }));
        return new Response(
          JSON.stringify({ success: true, projects, total: projects.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "status": {
        const pid = project_id || app_name;
        if (!pid) {
          return new Response(
            JSON.stringify({ success: false, error: "project_id or app_name required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const res = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(pid)}`, { headers });
        const data = await res.json();
        return new Response(
          JSON.stringify({
            success: res.ok,
            project: res.ok ? {
              name: data.name,
              id: data.id,
              url: `https://${data.name}.vercel.app`,
              framework: data.framework,
              latest_deployment: data.latestDeployments?.[0]?.url,
              status: data.latestDeployments?.[0]?.readyState,
            } : data,
          }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        const pid = project_id || app_name;
        if (!pid) {
          return new Response(
            JSON.stringify({ success: false, error: "project_id or app_name required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const res = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(pid)}`, {
          method: "DELETE",
          headers,
        });
        return new Response(
          JSON.stringify({ success: res.ok, message: res.ok ? `Project ${pid} deleted` : "Delete failed" }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "logs": {
        const pid = project_id || app_name;
        if (!pid) {
          return new Response(
            JSON.stringify({ success: false, error: "project_id or app_name required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Get latest deployments
        const res = await fetch(`https://api.vercel.com/v6/deployments?projectId=${encodeURIComponent(pid)}&limit=5`, { headers });
        const data = await res.json();
        return new Response(
          JSON.stringify({
            success: res.ok,
            deployments: (data.deployments || []).map((d: any) => ({
              id: d.uid,
              url: `https://${d.url}`,
              state: d.readyState || d.state,
              created: d.created,
              meta: d.meta,
            })),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "health": {
        const res = await fetch("https://api.vercel.com/v9/projects?limit=1", { headers });
        return new Response(
          JSON.stringify({ success: res.ok, platform: "vercel", status: res.ok ? "connected" : "error" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
