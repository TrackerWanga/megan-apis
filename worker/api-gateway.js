// ─── Megan APIs — Cloudflare Worker Gateway (D1 Backend) ──────────────────
const RENDER_URL = "https://megan-apis.onrender.com";

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
  const result = await db.prepare("SELECT * FROM api_keys WHERE key = ? AND active = true").bind(apikey).first();
  return result || null;
}

async function checkRateLimit(db, apikey, limit) {
  const today = new Date().toISOString().split("T")[0];
  const usage = await db.prepare("SELECT count FROM usage WHERE api_key = ? AND date = ?").bind(apikey, today).first();
  return usage ? usage.count : 0;
}

async function incrementUsage(db, apikey) {
  const today = new Date().toISOString().split("T")[0];
  await db.prepare(
    "INSERT INTO usage (api_key, date, count) VALUES (?, ?, 1) ON CONFLICT(api_key, date) DO UPDATE SET count = count + 1"
  ).bind(apikey, today).run();
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ─── Public Routes ──────────────────────────────────────────────────
    if (path.startsWith("/api/config/cards") || path.startsWith("/api/media/status")) {
      return fetch(`${RENDER_URL}${path}${url.search}`, { method: request.method, headers: request.headers, body: request.body });
    }

    // ─── Admin Routes (Render handles auth) ─────────────────────────────
    if (path.startsWith("/api/admin") || path === "/api/keys/generate") {
      return fetch(`${RENDER_URL}${path}${url.search}`, { method: request.method, headers: request.headers, body: request.body });
    }

    // ─── API Key Validation ─────────────────────────────────────────────
    const apikey = getApiKey(request);
    if (!apikey) {
      return corsResponse(JSON.stringify({ success: false, error: "API key required. Get one at https://meganapis.space", creator: "Megan APIs by Tracker Wanga | Falcon Tech" }), 401);
    }

    const keyData = await validateKey(env.DB, apikey);
    if (!keyData) {
      return corsResponse(JSON.stringify({ success: false, error: "Invalid or revoked API key", creator: "Megan APIs by Tracker Wanga | Falcon Tech" }), 403);
    }

    // ─── Rate Limiting ──────────────────────────────────────────────────
    const usage = await checkRateLimit(env.DB, apikey, keyData.rate_limit);
    if (usage >= keyData.rate_limit) {
      return corsResponse(JSON.stringify({ success: false, error: `Rate limit exceeded (${keyData.rate_limit}/day). Resets at midnight UTC.`, limit: keyData.rate_limit, usage, creator: "Megan APIs by Tracker Wanga | Falcon Tech" }), 429);
    }

    await incrementUsage(env.DB, apikey);

    // ─── Forward to Render ──────────────────────────────────────────────
    const cleanUrl = new URL(`${RENDER_URL}${path}${url.search}`);
    cleanUrl.searchParams.delete("apikey");
    cleanUrl.searchParams.delete("api_key");

    const response = await fetch(cleanUrl.toString(), { method: request.method, headers: request.headers, body: request.body });
    const modifiedResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => modifiedResponse.headers.set(key, value));
    return modifiedResponse;
  },
};
