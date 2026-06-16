import type { Express, Request, Response } from "express";
import * as social from "../lib/downloaders/social-tools";
import * as extra from "../lib/downloaders/extra-tools";
import * as pdfTools from "../lib/downloaders/pdf-tools";

export function registerSocialRoutes(app: Express): void {
  // ─── SOCIAL MEDIA ─────────────────────────────────
  app.get("/api/social/youtube-thumbnails", async (req: Request, res: Response) => {
    try { const url = req.query.url as string; if (!url) return res.status(400).json({ error: "Missing url" });
    const result = social.getYouTubeThumbnails(url); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/social/link-preview", async (req: Request, res: Response) => {
    try { const url = req.query.url as string; if (!url) return res.status(400).json({ error: "Missing url" });
    const result = await social.getLinkPreview(url); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── WHATSAPP ─────────────────────────────────────
  app.get("/api/whatsapp/link", async (req: Request, res: Response) => {
    try { const phone = req.query.phone as string; if (!phone) return res.status(400).json({ error: "Missing phone" });
    const msg = req.query.message as string;
    const result = social.getWhatsAppLink(phone, msg); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/whatsapp/check", async (req: Request, res: Response) => {
    try { const phone = req.query.phone as string; if (!phone) return res.status(400).json({ error: "Missing phone" });
    const clean = phone.replace(/[^0-9]/g, "");
    const valid = clean.length >= 10 && clean.length <= 15;
    return res.json({ success: true, phone: clean, valid, whatsappLink: valid ? `https://wa.me/${clean}` : null }); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/whatsapp/carrier", async (req: Request, res: Response) => {
    try { const phone = req.query.phone as string; if (!phone) return res.status(400).json({ error: "Missing phone" });
    const clean = phone.replace(/[^0-9]/g, "");
    const carriers: Record<string, string> = { "25470":"Safaricom","25471":"Safaricom","25472":"Safaricom","25479":"Safaricom","25473":"Airtel","25478":"Airtel","25475":"Airtel","25474":"Telkom","25477":"Telkom","25411":"Safaricom","25410":"Airtel" };
    let carrier = "Unknown";
    for (const [prefix, name] of Object.entries(carriers)) { if (clean.startsWith(prefix)) { carrier = name; break; } }
    return res.json({ success: true, phone: clean, carrier, country: "Kenya" }); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── EMAIL ────────────────────────────────────────
  app.get("/api/email/gravatar", async (req: Request, res: Response) => {
    try { const email = req.query.email as string; if (!email) return res.status(400).json({ error: "Missing email" });
    const result = social.getGravatar(email); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/email/disposable", async (req: Request, res: Response) => {
    try { const email = req.query.email as string; if (!email) return res.status(400).json({ error: "Missing email" });
    const result = social.checkDisposableEmail(email); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── TIME ─────────────────────────────────────────
  app.get("/api/time/day-of-year", async (req: Request, res: Response) => {
    try { const result = extra.getDayOfYear(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/time/countdown", async (req: Request, res: Response) => {
    try { const date = req.query.date as string; if (!date) return res.status(400).json({ error: "Missing date" });
    const result = extra.getCountdown(date); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── MATH ─────────────────────────────────────────
  app.get("/api/math/prime", async (req: Request, res: Response) => {
    try { const n = parseInt(req.query.number as string); if (isNaN(n)) return res.status(400).json({ error: "Missing number" });
    const result = extra.isPrime(n); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/math/factorial", async (req: Request, res: Response) => {
    try { const n = parseInt(req.query.number as string); if (isNaN(n)) return res.status(400).json({ error: "Missing number" });
    const result = extra.factorial(n); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/math/fibonacci", async (req: Request, res: Response) => {
    try { const c = parseInt(req.query.count as string) || 10;
    const result = extra.fibonacci(c); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/math/bmi", async (req: Request, res: Response) => {
    try { const w = parseFloat(req.query.weight as string); const h = parseFloat(req.query.height as string);
    if (isNaN(w) || isNaN(h)) return res.status(400).json({ error: "Missing weight/height" });
    const unit = (req.query.unit as string) || "metric";
    const result = extra.calculateBMI(w, h, unit as any); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── ENCODING ─────────────────────────────────────
  app.get("/api/encode/hex", async (req: Request, res: Response) => {
    try { const text = req.query.text as string; const decode = req.query.decode as string;
    const result = decode ? extra.hexDecode(text) : extra.hexEncode(text); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/encode/binary", async (req: Request, res: Response) => {
    try { const text = req.query.text as string; const decode = req.query.decode as string;
    const result = decode ? extra.binaryDecode(text) : extra.binaryEncode(text); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/encode/rot13", async (req: Request, res: Response) => {
    try { const text = req.query.text as string; if (!text) return res.status(400).json({ error: "Missing text" });
    const result = extra.rot13(text); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/encode/morse", async (req: Request, res: Response) => {
    try { const text = req.query.text as string; if (!text) return res.status(400).json({ error: "Missing text" });
    const result = extra.morseEncode(text); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.post("/api/encode/jwt-decode", async (req: Request, res: Response) => {
    try { const { token } = req.body; if (!token) return res.status(400).json({ error: "Missing token" });
    const result = extra.jwtDecode(token); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── QR ADVANCED ──────────────────────────────────
  app.get("/api/qr/wifi", async (req: Request, res: Response) => {
    try { const ssid = req.query.ssid as string; const pass = req.query.password as string;
    if (!ssid || !pass) return res.status(400).json({ error: "Missing ssid/password" });
    const enc = (req.query.encryption as string) || "WPA";
    const result = extra.generateWiFiQR(ssid, pass, enc as any); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/qr/vcard", async (req: Request, res: Response) => {
    try { const name = req.query.name as string; if (!name) return res.status(400).json({ error: "Missing name" });
    const result = extra.generateVCardQR(name, req.query.phone as string, req.query.email as string, req.query.org as string);
    return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── GAMES ────────────────────────────────────────
  app.get("/api/games/8ball", async (req: Request, res: Response) => {
    try { const result = extra.magic8Ball(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/games/this-day", async (req: Request, res: Response) => {
    try { const result = extra.getThisDayInHistory(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/games/numbers", async (req: Request, res: Response) => {
    try { const n = parseInt(req.query.number as string); if (isNaN(n)) return res.status(400).json({ error: "Missing number" });
    const result = extra.numberFact(n); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.get("/api/games/programming-joke", async (req: Request, res: Response) => {
    try { const result = extra.programmingJoke(); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── OTP ──────────────────────────────────────────
  app.post("/api/auth/generate-otp", async (req: Request, res: Response) => {
    try { const { phone } = req.body; if (!phone) return res.status(400).json({ error: "Missing phone" });
    const result = extra.generateOTP(phone); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try { const { phone, code } = req.body; if (!phone || !code) return res.status(400).json({ error: "Missing phone/code" });
    const result = extra.verifyOTP(phone, code); return res.json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ─── PDF GENERATION ──────────────────────────────
  app.post("/api/tools/generate-pdf", async (req: Request, res: Response) => {
    try { const result = await pdfTools.generatePdf(req.body);
    if (result.success) return res.json(result);
    return res.status(500).json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
  app.post("/api/tools/generate-invoice", async (req: Request, res: Response) => {
    try { const result = await pdfTools.generateInvoice(req.body);
    if (result.success) return res.json(result);
    return res.status(500).json(result); } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });
}
