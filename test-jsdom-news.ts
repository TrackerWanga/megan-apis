import { JSDOM } from "jsdom";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function deepScan(name: string, url: string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" } });
    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    console.log(`\n══════════ ${name} (${html.length.toLocaleString()} bytes) ══════════`);
    
    // Check all script tags for embedded data
    const scripts = doc.querySelectorAll("script");
    let foundData = 0;
    
    scripts.forEach((s, i) => {
      const text = s.textContent || "";
      // Skip empty scripts
      if (text.length < 50) return;
      
      // Check for common data patterns
      const patterns = [
        "__NEXT_DATA__", "__NUXT__", "__INITIAL_STATE__",
        "window.__data", "window.__preloadedData", "window.__INITIAL",
        "articles", "posts", "items", "listings",
        "JSON.parse", "dataLayer",
      ];
      
      const matched = patterns.filter(p => text.includes(p));
      if (matched.length > 0) {
        foundData++;
        console.log(`  Script #${i} (${text.length} chars) → contains: ${matched.join(", ")}`);
        console.log(`    Preview: ${text.substring(0, 150)}...`);
      }
    });

    // Check meta for article count
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (metaDesc) console.log(`  Meta: ${metaDesc.getAttribute("content")}`);

    // Count article-like elements
    const articles = doc.querySelectorAll("article");
    const h2s = doc.querySelectorAll("h2");
    const h3s = doc.querySelectorAll("h3");
    console.log(`  Elements: ${articles.length} articles, ${h2s.length} h2s, ${h3s.length} h3s`);
    
    if (foundData === 0) {
      // Show first few h2/h3 as fallback
      const titles = [...doc.querySelectorAll("h2, h3")]
        .slice(0, 5)
        .map(el => el.textContent?.trim().substring(0, 80))
        .filter(Boolean);
      console.log(`  Sample h2/h3: ${titles.join(" | ")}`);
      console.log(`  ⚠️ No embedded JSON found — JS-rendered`);
    }
  } catch (e: any) {
    console.log(`\n❌ ${name}: ${e.message}`);
  }
}

async function main() {
  await deepScan("Kenyans.co.ke", "https://www.kenyans.co.ke/");
  await deepScan("Tuko News", "https://www.tuko.co.ke/");
  await deepScan("Standard Media", "https://www.standardmedia.co.ke/");
  await deepScan("Nation Africa", "https://nation.africa/kenya");
  await deepScan("Jiji Kenya", "https://jiji.co.ke/");
  await deepScan("PigiaMe", "https://www.pigiame.co.ke/");
}

main().catch(console.error);
