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
  await new Promise(r => setTimeout(r, 1000));
  const res = await fetch(url, {
    headers: {
      "User-Agent": randomUA(),
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.google.com/",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return new JSDOM(await res.text(), { url });
}

function fixUrl(base: string, link: string | null | undefined): string {
  if (!link) return base;
  if (link.startsWith("http")) return link;
  if (link.startsWith("//")) return "https:" + link;
  return base + (link.startsWith("/") ? link : "/" + link);
}

export async function scrapeTukoNews() {
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
  
  return { source: "Tuko.co.ke", count: articles.length, articles: articles.slice(0, 20) };
}

export async function scrapeNationNews() {
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
