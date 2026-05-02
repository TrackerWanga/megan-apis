import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { getSettings } from "./admin-settings";

const CREATOR = "Megan APIs by Tracker Wanga | Falcon Tech";
const isDev = process.env.NODE_ENV !== "production";

// ─── Per-IP Tracking (for admin visibility) ───────────────────────────────────

interface IpRecord { hits: number; blocked: boolean; firstSeen: number; lastSeen: number; }
const IP_TODAY: Record<string, IpRecord> = {};
const IP_ALLTIME: Record<string, number> = {};
let ipTrackDay = new Date().toDateString();

function checkIpDayRollover() {
  const today = new Date().toDateString();
  if (today !== ipTrackDay) {
    for (const k in IP_TODAY) delete IP_TODAY[k];
    ipTrackDay = today;
  }
}

export function trackIpRequest(ip: string) {
  checkIpDayRollover();
  if (!IP_TODAY[ip]) IP_TODAY[ip] = { hits: 0, blocked: false, firstSeen: Date.now(), lastSeen: Date.now() };
  IP_TODAY[ip].hits++;
  IP_TODAY[ip].lastSeen = Date.now();
  IP_ALLTIME[ip] = (IP_ALLTIME[ip] || 0) + 1;
}

export function getTopIpsToday(n = 15) {
  checkIpDayRollover();
  return Object.entries(IP_TODAY)
    .sort((a, b) => b[1].hits - a[1].hits)
    .slice(0, n)
    .map(([ip, rec]) => ({ ip, hits: rec.hits, lastSeen: rec.lastSeen }));
}

export function getSecurityStats() {
  checkIpDayRollover();
  return {
    uniqueIpsToday: Object.keys(IP_TODAY).length,
    topIpsToday: getTopIpsToday(15),
    currentDay: new Date().toDateString(),
  };
}

// ─── Bot / Scanner UA Detection ───────────────────────────────────────────────

const BLOCKED_UA_RE = [
  /scrapy/i,
  /python-requests\/[01]\./i,       // very old python-requests
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /zgrab/i,
  /nuclei/i,
  /dirbuster/i,
  /gobuster/i,
  /ffuf/i,
  /wfuzz/i,
  /hydra/i,
  /burpsuite/i,
  /acunetix/i,
  /nessus/i,
  /openvas/i,
];

export function botBlocker(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api/")) return next();

  const ua = req.headers["user-agent"] || "";

  if (ua === "") {
    return res.status(403).json({ success: false, error: "Access denied.", creator: CREATOR });
  }

  for (const pattern of BLOCKED_UA_RE) {
    if (pattern.test(ua)) {
      return res.status(403).json({ success: false, error: "Access denied.", creator: CREATOR });
    }
  }

  next();
}

// ─── IP Blocklist Middleware ───────────────────────────────────────────────────

export function ipBlocklistGuard(req: Request, res: Response, next: NextFunction) {
  if (isDev) return next();
  const ip = (req.ip || req.socket.remoteAddress || "").replace(/^::ffff:/, "");
  const blocklist: string[] = (getSettings() as any).ipBlocklist || [];
  if (blocklist.includes(ip)) {
    return res.status(403).json({ success: false, error: "Access denied.", creator: CREATOR });
  }
  next();
}

// ─── Rate Limiters ────────────────────────────────────────────────────────────

function makeRateLimitHandler(msg: string) {
  return (_req: Request, res: Response) => {
    res.status(429).json({ success: false, error: msg, creator: CREATOR });
  };
}

// Global: 300 req / 15 min per IP — hard ceiling against floods
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeRateLimitHandler("Too many requests. Slow down."),
  skip: (req) => !req.path.startsWith("/api") && !req.path.startsWith("/download"),
});

// Login: 5 attempts / 15 min per IP — brute force protection
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeRateLimitHandler("Too many login attempts. Try again later."),
});

// General API: 80 req / min per IP
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 10000 : 80,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeRateLimitHandler("API rate limit exceeded. Try again in a moment."),
});

// Heavy endpoints (downloads, video search, etc.): 20 req / min per IP
export const heavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeRateLimitHandler("Download/search rate limit exceeded. Please wait a moment."),
});

// Admin endpoints: 30 req / 5 min per IP
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDev ? 10000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeRateLimitHandler("Admin rate limit exceeded."),
});

// ─── Security Headers ─────────────────────────────────────────────────────────

export function securityHeaders() {
  if (isDev) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        frameAncestors: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xFrameOptions: false,
  });
}

// ─── Anti-clone (protects endpoint list) ─────────────────────────────────────

export function antiClone(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api/")) return next();
  const path = req.path;

  if (path === "/api/endpoints/list" || path === "/api/all-endpoints") {
    const referer = req.headers.referer || req.headers.origin || "";
    const host = req.headers.host || "";
    const ua = req.headers["user-agent"] || "";

    const isFromOwnSite = referer.includes(host) || referer === "";
    const isBrowser = /Mozilla|Chrome|Safari|Firefox|Edge/i.test(ua);

    if (!isFromOwnSite || !isBrowser) {
      return res.status(403).json({
        success: false,
        error: "Access denied. This endpoint is for internal use only.",
        creator: CREATOR,
      });
    }
  }

  next();
}

// ─── Response Fingerprint ─────────────────────────────────────────────────────

export function responseFingerprint(_req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      body._powered = "WolfAPIs";
      body._ts = Date.now();
    }
    return originalJson(body);
  };
  next();
}

// ─── Block Direct Source Access ───────────────────────────────────────────────

export function blockDirectSourceAccess(req: Request, res: Response, next: NextFunction) {
  if (isDev) return next();

  const path = req.path.toLowerCase();
  const blockedExtensions = [".ts", ".tsx", ".map", ".env", ".lock", ".toml"];
  const blockedDirs = ["/server/", "/lib/", "/shared/", "/.local/", "/node_modules/", "/.git/"];

  if (path.startsWith("/api/") || path.startsWith("/download/") || path.startsWith("/assets/")) {
    return next();
  }

  for (const dir of blockedDirs) {
    if (path.startsWith(dir)) {
      return res.status(404).json({ error: "Not found" });
    }
  }

  for (const ext of blockedExtensions) {
    if (path.endsWith(ext)) {
      return res.status(404).json({ error: "Not found" });
    }
  }

  next();
}
