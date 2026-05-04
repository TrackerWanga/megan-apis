// ─── Megan APIs — Cloudflare Worker (API Gateway + Frontend) ───────────────
const RENDER_URL = "https://megan-apis.onrender.com";
const PAGES_URL = "https://megan-apis-frontend.pages.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, x-admin-password",
};

function corsResponse(body, status = 200) {
  return new Response(body, { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function getApiKey(request) {
  const url = new URL(request.url);
  return url.searchParams.get("apikey") || url.searchParams.get("api_key") || request.headers.get("x-api-key") || null;
}

async function validateKey(db, apikey) {
  let result = await db.prepare("SELECT * FROM api_keys WHERE key = ? AND active = 1").bind(apikey).first();
  if (result) return { ...result, source: "api_keys" };
  result = await db.prepare("SELECT api_key as key, rate_limit, coins, is_admin FROM users WHERE api_key = ? AND active = 1").bind(apikey).first();
  if (result) return { ...result, source: "users", name: "Admin" };
  return null;
}

async function checkRateLimit(db, apikey) {
  const today = new Date().toISOString().split("T")[0];
  const usage = await db.prepare("SELECT count FROM usage WHERE api_key = ? AND date = ?").bind(apikey, today).first();
  return usage ? usage.count : 0;
}

async function incrementUsage(db, apikey) {
  const today = new Date().toISOString().split("T")[0];
  await db.prepare("INSERT INTO usage (api_key, date, count) VALUES (?, ?, 1) ON CONFLICT(api_key, date) DO UPDATE SET count = count + 1").bind(apikey, today).run();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ─── API Routes → Validate & Proxy to Render ──────────────────────────
    if (path.startsWith("/api/") || path.startsWith("/download/") || path.startsWith("/files/") || path.startsWith("/proxy") || path.startsWith("/stream")) {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      // Public routes
      if (path === "/api/config/cards" || path === "/api/media/status" || path === "/api/keys/generate" || path.startsWith("/api/keys/")) {
        const response = await fetch(`${RENDER_URL}${path}${url.search}`, { method: request.method, headers: request.headers, body: request.body });
        const mod = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([k, v]) => mod.headers.set(k, v));
        return mod;
      }

      // Admin routes
      if (path.startsWith("/api/admin")) {
        const response = await fetch(`${RENDER_URL}${path}${url.search}`, { method: request.method, headers: request.headers, body: request.body });
        const mod = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([k, v]) => mod.headers.set(k, v));
        return mod;
      }

      // API Key validation
      const apikey = getApiKey(request);
      if (!apikey) {
        return corsResponse(JSON.stringify({ success: false, error: "API key required. Get one at https://apis.megan.qzz.io/keys", creator: "Megan APIs by Tracker Wanga | Falcon Tech" }), 401);
      }

      const keyData = await validateKey(env.DB, apikey);
      if (!keyData) {
        return corsResponse(JSON.stringify({ success: false, error: "Invalid or revoked API key", creator: "Megan APIs by Tracker Wanga | Falcon Tech" }), 403);
      }

      if (!keyData.is_admin) {
        const usage = await checkRateLimit(env.DB, apikey);
        const limit = keyData.rate_limit || 50;
        if (usage >= limit) {
          return corsResponse(JSON.stringify({ success: false, error: `Rate limit exceeded (${limit}/day). Resets at midnight UTC.`, limit, usage, creator: "Megan APIs by Tracker Wanga | Falcon Tech" }), 429);
        }
      }

      await incrementUsage(env.DB, apikey);
      const cleanUrl = new URL(`${RENDER_URL}${path}${url.search}`);
      cleanUrl.searchParams.delete("apikey");
      cleanUrl.searchParams.delete("api_key");
      const response = await fetch(cleanUrl.toString(), { method: request.method, headers: request.headers, body: request.body });
      const mod = new Response(response.body, response);
      Object.entries(corsHeaders).forEach(([k, v]) => mod.headers.set(k, v));
      return mod;
    }

    // ─── Frontend → Serve from Cloudflare Pages ───────────────────────────
    const frontendUrl = `${PAGES_URL}${path}${url.search}`;
    const frontendResponse = await fetch(frontendUrl, { method: request.method, headers: request.headers });
    return frontendResponse;
  },
};
