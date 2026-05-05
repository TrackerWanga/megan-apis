import { JSDOM } from "jsdom";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/131.0.0.0 Safari/537.36",
];

function randomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }

async function fetchDOM(url: string): Promise<JSDOM> {
  // Add delay to avoid rate limiting
  await new Promise(r => setTimeout(r, 1000));
  const res = await fetch(url, {
    headers: {
      "User-Agent": randomUA(),
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      "Referer": "https://www.google.com/",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return new JSDOM(html, { url });
}

function fixUrl(base: string, link: string | null | undefined): string {
  if (!link) return base;
  if (link.startsWith("http")) return link;
  if (link.startsWith("//")) return "https:" + link;
  return base + (link.startsWith("/") ? link : "/" + link);
}

// ─── 1. Kenyans.co.ke ────────────────────────────────────────────────────
export async function scrapeKenyansNews() {
  try { const dom = await fetchDOM() {
  try {() {
  const dom = await fetchDOM("https://www.kenyans.co.ke/");
  const doc = dom.window.document;
  const articles: any[] = [];
  
  doc.querySelectorAll("article").forEach((el) => {
    const title = el.querySelector("h2, h3, a")?.textContent?.trim();
    const link = el.querySelector("a")?.getAttribute("href");
    if (title && title.length > 15) {
      articles.push({
        title: title.substring(0, 150),
        url: fixUrl("https://www.kenyans.co.ke", link),
      });
    }
  });
  
  } catch (e: any) {
    return { source: "Kenyans.co.ke", count: 0, articles: [], error: "Scraper temporarily unavailable"
    };
  }
  return { source: "Kenyans.co.ke", count: articles.length, articles: articles.slice(0, 20) };
}

// ─── 2. Tuko News ─────────────────────────────────────────────────────────
export async function scrapeTukoNews() {
  try { const dom = await fetchDOM() {
  const dom = await fetchDOM("https://www.tuko.co.ke/");
  const doc = dom.window.document;
  const articles: any[] = [];
  
  doc.querySelectorAll("article, [class*='article'], [class*='news']").forEach((el) => {
    const title = el.querySelector("h2, h3, a")?.textContent?.trim();
    const link = el.querySelector("a")?.getAttribute("href");
    const img = el.querySelector("img")?.getAttribute("src") || el.querySelector("img")?.getAttribute("data-src");
    if (title && title.length > 15) {
      articles.push({
        title: title.substring(0, 150),
        url: fixUrl("https://www.tuko.co.ke", link),
        image: img?.startsWith("http") ? img : img ? `https:${img}` : null,
      });
    }
  });
  
  const seen = new Set();
  const unique = articles.filter(a => { if (seen.has(a.title)) return false; seen.add(a.title); return true; });
  return { source: "Tuko.co.ke", count: unique.length, articles: unique.slice(0, 20) };
}

// ─── 3. Standard Media ────────────────────────────────────────────────────
export async function scrapeStandardNews() {
  try { const dom = await fetchDOM() {
  const dom = await fetchDOM("https://www.standardmedia.co.ke/");
  const doc = dom.window.document;
  const articles: any[] = [];
  
  doc.querySelectorAll("h2, h3, h4").forEach((el) => {
    const title = el.textContent?.trim();
    const link = el.closest("a")?.getAttribute("href") || el.querySelector("a")?.getAttribute("href");
    if (title && title.length > 15) {
      articles.push({
        title: title.substring(0, 150),
        url: fixUrl("https://www.standardmedia.co.ke", link),
      });
    }
  });
  
  return { source: "Standard Media", count: articles.length, articles: articles.slice(0, 20) };
}

// ─── 4. Nation Africa ─────────────────────────────────────────────────────
export async function scrapeNationNews() {
  try { const dom = await fetchDOM() {
  const dom = await fetchDOM("https://nation.africa/kenya");
  const doc = dom.window.document;
  const articles: any[] = [];
  
  doc.querySelectorAll("article, .article-item, .story-card, .card-article, .teaser").forEach((el) => {
    const title = el.querySelector("h2, h3, .article-title, .teaser-title")?.textContent?.trim();
    const link = el.querySelector("a")?.getAttribute("href");
    const img = el.querySelector("img")?.getAttribute("src");
    if (title && title.length > 15) {
      articles.push({
        title: title.replace(/\n+/g, " ").substring(0, 150),
        url: fixUrl("https://nation.africa", link),
        image: fixUrl("https://nation.africa", img),
      });
    }
  });
  
  return { source: "Nation Africa", count: articles.length, articles: articles.slice(0, 20) };
}

// ─── 5. Jiji Kenya Classifieds ────────────────────────────────────────────
export async function scrapeJijiClassifieds() {
  const dom = await fetchDOM("https://jiji.co.ke/");
  const doc = dom.window.document;
  const listings: any[] = [];
  
  doc.querySelectorAll("[data-name]").forEach((el) => {
    const title = el.getAttribute("data-name");
    const price = el.getAttribute("data-price");
    const link = el.querySelector("a")?.getAttribute("href");
    if (title) {
      listings.push({
        title,
        price: price ? `KSh ${parseInt(price).toLocaleString()}` : "Contact seller",
        url: fixUrl("https://jiji.co.ke", link),
      });
    }
  });
  
  return { source: "Jiji Kenya", count: listings.length, listings: listings.slice(0, 20) };
}

export async function scrapePigiameClassifieds() {
  const dom = await fetchDOM("https://www.pigiame.co.ke/");
  const doc = dom.window.document;
  const listings: any[] = [];
  
  doc.querySelectorAll("[class*='listing'], [class*='ad-'], [class*='product']").forEach((el) => {
    const title = el.querySelector("h3, h4, [class*='title']")?.textContent?.trim();
    const link = el.querySelector("a")?.getAttribute("href");
    if (title && title.length > 5) {
      listings.push({
        title: title.substring(0, 120),
        url: fixUrl("https://www.pigiame.co.ke", link),
      });
    }
  });
  
  return { source: "PigiaMe", count: listings.length, listings: listings.slice(0, 20) };
}
