import axios from "axios";
import * as cheerio from "cheerio";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function extractLinks(url: string) {
  const res = await axios.get(url, { headers: { "User-Agent": UA }, timeout: 15000, maxRedirects: 5 });
  const $ = cheerio.load(res.data);
  const links: { href: string; text: string; internal: boolean }[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim().substring(0, 100);
    try {
      const fullUrl = new URL(href, url).href;
      links.push({ href: fullUrl, text: text || "(no text)", internal: new URL(fullUrl).hostname === new URL(url).hostname });
    } catch {}
  });
  return { url, totalLinks: links.length, links };
}

export async function inspectSite(url: string) {
  const res = await axios.get(url, { headers: { "User-Agent": UA }, timeout: 15000, maxRedirects: 5 });
  const $ = cheerio.load(res.data);
  const meta: Record<string, string> = {};
  $("meta[name], meta[property]").each((_, el) => {
    const name = $(el).attr("name") || $(el).attr("property") || "";
    const content = $(el).attr("content") || "";
    if (name && content) meta[name] = content.substring(0, 200);
  });
  return {
    url, status: res.status, statusText: res.statusText,
    title: $("title").text().trim() || null,
    description: meta.description || meta["og:description"] || null,
    meta,
    headers: res.headers,
    server: res.headers["server"] || null,
    contentType: res.headers["content-type"] || null,
  };
}

export async function extractScripts(url: string) {
  const res = await axios.get(url, { headers: { "User-Agent": UA }, timeout: 15000, maxRedirects: 5 });
  const $ = cheerio.load(res.data);
  const scripts: { src: string | null; inline: boolean; length: number }[] = [];
  $("script").each((_, el) => {
    const src = $(el).attr("src") || null;
    const text = $(el).html() || "";
    if (src) scripts.push({ src: src.startsWith("http") ? src : new URL(src, url).href, inline: false, length: 0 });
    else if (text.trim()) scripts.push({ src: null, inline: true, length: text.length });
  });
  return { url, totalScripts: scripts.length, scripts };
}

export async function getCookies(url: string) {
  const res = await axios.get(url, { headers: { "User-Agent": UA }, timeout: 15000, maxRedirects: 5, withCredentials: true });
  const cookies = res.headers["set-cookie"] || [];
  const parsed = (Array.isArray(cookies) ? cookies : [cookies]).map(c => {
    const parts = c.split(";").map(p => p.trim());
    const [nameVal, ...attrs] = parts;
    const [name, value] = nameVal.split("=");
    return { name, value, httpOnly: attrs.some(a => a.toLowerCase() === "httponly"), secure: attrs.some(a => a.toLowerCase() === "secure"), path: attrs.find(a => a.toLowerCase().startsWith("path="))?.split("=")[1] || "/" };
  });
  return { url, cookieCount: parsed.length, cookies: parsed };
}
