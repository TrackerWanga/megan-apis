import { JSDOM } from "jsdom";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function test() {
  const res = await fetch("https://jiji.co.ke/", { headers: { "User-Agent": UA } });
  const html = await res.text();
  const dom = new JSDOM(html, { url: "https://jiji.co.ke/" });
  const doc = dom.window.document;

  const scripts = doc.querySelectorAll("script");
  let found = false;
  
  scripts.forEach((s, i) => {
    const text = s.textContent || "";
    if (text.includes("__NUXT__") && text.length > 10000) {
      found = true;
      console.log(`Script #${i}: ${text.length} chars`);
      
      // Try to extract just the data part after __NUXT__=
      const match = text.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*\});/);
      if (match) {
        try {
          const nuxt = JSON.parse(match[1]);
          // Show top-level keys
          console.log("\nTop-level keys:", Object.keys(nuxt));
          
          // Look for state/data
          const stateStr = JSON.stringify(nuxt);
          
          // Find anything that looks like a listing URL
          const adUrls = stateStr.match(/"ad_url":"[^"]+"|"item_url":"[^"]+"|"slug":"[^"]+"/g);
          if (adUrls) console.log("\nAd URLs found:", adUrls.slice(0, 5));
          
          // Find images
          const images = stateStr.match(/https:\\?\/\\?\/[^"]+\.(jpg|jpeg|png|webp)/gi);
          if (images) console.log("\nImages found:", images.slice(0, 5));
          
          // Show a chunk of the state
          console.log("\nState preview (first 500 chars):", stateStr.substring(0, 500));
        } catch (e) {
          console.log("Parse failed:", e);
        }
      }
    }
  });
  
  if (!found) console.log("No Nuxt state found");
}

test().catch(console.error);
