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
  // Public key generation
  app.post("/api/keys/generate", async (req: Request, res: Response) => {
    try {
      const { name } = req.body || {};
      const apikey = generateKey();
      await d1Query(
        "INSERT INTO api_keys (key, name, rate_limit, active) VALUES (?, ?, 50, 1)",
        [apikey, name || "Free User"]
      );
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", key: { key: apikey, name: name || "Free User", rate_limit: 50 } });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // PUBLIC: Check key info and usage (no admin auth needed)
  app.get("/api/keys/:key/info", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const keyData = await d1Query("SELECT key, name, rate_limit, active, created_at FROM api_keys WHERE key = ?", [key]);
      if (!keyData.length) return res.status(404).json({ success: false, error: "Key not found" });
      const today = new Date().toISOString().split("T")[0];
      const usage = await d1Query("SELECT count FROM usage WHERE api_key = ? AND date = ?", [key, today]);
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", key: keyData[0], usage: { today: usage[0]?.count || 0 } });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin: Generate key
  app.post("/api/admin/keys/generate", async (req: Request, res: Response) => {
    try {
      const { name, rate_limit = 50, userId } = req.body || {};
      const apikey = generateKey();
      await d1Query(
        "INSERT INTO api_keys (key, user_id, name, rate_limit, active, created_by) VALUES (?, ?, ?, ?, 1, ?)",
        [apikey, userId || null, name || "Untitled", rate_limit, "admin_001"]
      );
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", key: { key: apikey, name: name || "Untitled", rate_limit } });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin: List keys
  app.get("/api/admin/keys", async (_req: Request, res: Response) => {
    try {
      const keys = await d1Query("SELECT * FROM api_keys ORDER BY created_at DESC");
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", keys });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin: Update key
  app.post("/api/admin/keys/:key/update", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { rate_limit, active, name } = req.body || {};
      if (rate_limit !== undefined) await d1Query("UPDATE api_keys SET rate_limit = ? WHERE key = ?", [rate_limit, key]);
      if (active !== undefined) await d1Query("UPDATE api_keys SET active = ? WHERE key = ?", [active ? 1 : 0, key]);
      if (name) await d1Query("UPDATE api_keys SET name = ? WHERE key = ?", [name, key]);
      const updated = await d1Query("SELECT * FROM api_keys WHERE key = ?", [key]);
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", key: updated[0] });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin: Revoke key
  app.delete("/api/admin/keys/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      await d1Query("UPDATE api_keys SET active = 0 WHERE key = ?", [key]);
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", message: `Key ${key} revoked` });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Admin: Key usage
  app.get("/api/admin/keys/:key/usage", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const today = new Date().toISOString().split("T")[0];
      const todayUsage = await d1Query("SELECT count FROM usage WHERE api_key = ? AND date = ?", [key, today]);
      const total = await d1Query("SELECT SUM(count) as total FROM usage WHERE api_key = ?", [key]);
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", today: todayUsage[0]?.count || 0, total: total[0]?.total || 0 });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // Login
  app.post("/api/keys/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body || {};
      const user = await d1Query("SELECT * FROM users WHERE email = ? AND password = ? AND active = 1", [email, password]);
      if (!user.length) return res.status(401).json({ success: false, error: "Invalid credentials" });
      return res.json({ success: true, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", user: { username: user[0].username, api_key: user[0].api_key, coins: user[0].coins, is_admin: !!user[0].is_admin } });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });
}
