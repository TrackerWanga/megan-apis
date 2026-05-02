import type { Express, Request, Response } from "express";

const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const D1_DATABASE_ID = process.env.D1_DATABASE_ID || "";
const CF_BASE = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/d1/database/${D1_DATABASE_ID}`;

function cfHeaders() {
  return { "Authorization": `Bearer ${CF_TOKEN}`, "Content-Type": "application/json" };
}

async function d1Query(sql: string, params: any[] = []) {
  const res = await fetch(`${CF_BASE}/query`, {
    method: "POST",
    headers: cfHeaders(),
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json() as any;
  if (!data.success) throw new Error(data.errors?.[0]?.message || "D1 query failed");
  return data.result?.[0]?.results || [];
}

function generateKey(prefix = "megan"): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 16; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${key}`;
}

export function registerApiKeyRoutes(app: Express) {
  // Admin generates a key
  app.post("/api/admin/keys/generate", async (req: Request, res: Response) => {
    try {
      const { name, rate_limit = 50, userId } = req.body || {};
      const apikey = generateKey();
      const id = `key_${Date.now()}`;
      await d1Query(
        "INSERT INTO api_keys (key, user_id, name, rate_rate_limit, active, created_by) VALUES (?, ?, ?, ?, true, ?)",
        [apikey, userId || null, name || "Untitled", limit, "admin_001"]
      );
      return res.json({ success: true, creator: "Megan APIs by Tracker Wanga | Falcon Tech", key: { key: apikey, name: name || "Untitled", limit } });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // List all keys
  app.get("/api/admin/keys", async (_req: Request, res: Response) => {
    try {
      const keys = await d1Query("SELECT * FROM api_keys ORDER BY created_at DESC");
      return res.json({ success: true, creator: "Megan APIs by Tracker Wanga | Falcon Tech", keys });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Update a key
  app.post("/api/admin/keys/:key/update", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { rate_limit, active, name } = req.body || {};
      if (limit !== undefined) await d1Query("UPDATE api_keys SET rate_limit = ? WHERE key = ?", [limit, key]);
      if (active !== undefined) await d1Query("UPDATE api_keys SET active = ? WHERE key = ?", [active ? 1 : 0, key]);
      if (name) await d1Query("UPDATE api_keys SET name = ? WHERE key = ?", [name, key]);
      const updated = await d1Query("SELECT * FROM api_keys WHERE key = ?", [key]);
      return res.json({ success: true, creator: "Megan APIs by Tracker Wanga | Falcon Tech", key: updated[0] });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Revoke a key
  app.delete("/api/admin/keys/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      await d1Query("UPDATE api_keys SET active = false WHERE key = ?", [key]);
      return res.json({ success: true, creator: "Megan APIs by Tracker Wanga | Falcon Tech", message: `Key ${key} revoked` });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Get usage stats for a key
  app.get("/api/admin/keys/:key/usage", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const today = new Date().toISOString().split("T")[0];
      const usage = await d1Query("SELECT * FROM usage WHERE api_key = ? AND date = ?", [key, today]);
      const total = await d1Query("SELECT SUM(count) as total FROM usage WHERE api_key = ?", [key]);
      return res.json({ success: true, creator: "Megan APIs by Tracker Wanga | Falcon Tech", today: usage[0]?.count || 0, total: total[0]?.total || 0 });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin login (returns master key for admin API access)
  app.post("/api/keys/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body || {};
      const user = await d1Query("SELECT * FROM users WHERE email = ? AND password = ? AND active = true", [email, password]);
      if (!user.length) return res.status(401).json({ success: false, error: "Invalid credentials" });
      return res.json({ success: true, creator: "Megan APIs by Tracker Wanga | Falcon Tech", user: { username: user[0].username, api_key: user[0].api_key, coins: user[0].coins, is_admin: !!user[0].is_admin } });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Public key generation (self-service — uses coin cost in future)
  app.post("/api/keys/generate", async (req: Request, res: Response) => {
    try {
      const { name } = req.body || {};
      const apikey = generateKey();
      await d1Query("INSERT INTO api_keys (key, name, rate_rate_limit, active, created_by) VALUES (?, ?, 50, true, 'public')", [apikey, name || "Free User"]);
      return res.json({ success: true, creator: "Megan APIs by Tracker Wanga | Falcon Tech", key: { key: apikey, name: name || "Free User", rate_limit: 50 } });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
}
