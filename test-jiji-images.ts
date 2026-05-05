import { JSDOM } from "jsdom";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function test() {
  const res = await fetch("https://jiji.co.ke/", { headers: { "User-Agent": UA } });
  const html = await res.text();
  const dom = new JSDOM(html, { url: "https://jiji.co.ke/" });
  const doc = dom.window.document;

  // Get the Nuxt JSON state
  const scripts = doc.querySelectorAll("script");
  for (const s of scripts) {
    const text = s.textContent || "";
    if (text.includes("__NUXT__") && text.length > 10000) {
      const match = text.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*\});/);
      if (match) {
        const data = JSON.parse(match[1]);
        // Search for listing data
        const str = JSON.stringify(data);
        // Find image URLs and listing URLs
        const imgMatches = str.match(/"image_url":"([^"]+)"/g)?.slice(0, 5) || [];
        const urlMatches = str.match(/"url":"(\/item[^"]+)"/g)?.slice(0, 5) || [];
        const titleMatches = str.match(/"title":"([^"]+)"/g)?.slice(0, 5) || [];
        const priceMatches = str.match(/"price":"([^"]+)"/g)?.slice(0, 5) || [];
        
        console.log("IMAGES:", imgMatches);
        console.log("URLS:", urlMatches);
        console.log("TITLES:", titleMatches);
        console.log("PRICES:", priceMatches);
      }
    }
  }
}

test().catch(console.error);
