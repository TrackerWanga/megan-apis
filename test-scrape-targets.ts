import { JSDOM } from "jsdom";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function testSite(name: string, url: string, checkFn: (dom: JSDOM) => string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" }, signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    const dom = new JSDOM(html, { url });
    console.log(`\n✅ ${name} (${html.length.toLocaleString()} bytes)`);
    console.log(checkFn(dom));
  } catch (e: any) {
    console.log(`❌ ${name}: ${e.message}`);
  }
}

// ─── TEST SITES ──────────────────────────────────────────────────────────

async function main() {
  // 1. Tuko.co.ke - News
  await testSite("Tuko News", "https://www.tuko.co.ke/", (dom) => {
    const articles = dom.window.document.querySelectorAll("article a, .news-item a, h3 a");
    const titles = Array.from(articles).slice(0, 5).map(a => a.textContent?.trim()).filter(Boolean);
    return `Found ${articles.length} article links. Titles: ${titles.join(", ")}`;
  });

  // 2. Kenyans.co.ke - News
  await testSite("Kenyans.co.ke", "https://www.kenyans.co.ke/", (dom) => {
    const articles = dom.window.document.querySelectorAll("article a, h2 a, h3 a");
    const titles = Array.from(articles).slice(0, 5).map(a => a.textContent?.trim()).filter(Boolean);
    return `Found ${articles.length} article links. Titles: ${titles.join(", ")}`;
  });

  // 3. Nation Africa - News
  await testSite("Nation Africa", "https://nation.africa/kenya", (dom) => {
    const articles = dom.window.document.querySelectorAll("article a, h2 a, h3 a, .article-title");
    const titles = Array.from(articles).slice(0, 5).map(a => a.textContent?.trim()).filter(Boolean);
    return `Found ${articles.length} article links. Titles: ${titles.join(", ")}`;
  });

  // 4. Standard Media
  await testSite("Standard Media", "https://www.standardmedia.co.ke/", (dom) => {
    const articles = dom.window.document.querySelectorAll("article a, h2 a, h3 a");
    const titles = Array.from(articles).slice(0, 5).map(a => a.textContent?.trim()).filter(Boolean);
    return `Found ${articles.length} links`;
  });

  // 5. Jiji.co.ke - Classifieds
  await testSite("Jiji Kenya", "https://jiji.co.ke/", (dom) => {
    const items = dom.window.document.querySelectorAll("[data-name], .b-list-item__title, .qa-advert-title");
    const titles = Array.from(items).slice(0, 5).map(a => a.textContent?.trim()).filter(Boolean);
    return `Found ${items.length} listings. Titles: ${titles.join(", ")}`;
  });

  // 6. PigiaMe - Classifieds  
  await testSite("PigiaMe", "https://www.pigiame.co.ke/", (dom) => {
    const items = dom.window.document.querySelectorAll(".listing-title, h3 a, article a");
    const titles = Array.from(items).slice(0, 5).map(a => a.textContent?.trim()).filter(Boolean);
    return `Found ${items.length} listings`;
  });

  // 7. BuyRentKenya - Property
  await testSite("BuyRentKenya", "https://www.buyrentkenya.com/", (dom) => {
    const items = dom.window.document.querySelectorAll(".listing-title, h2 a, .property-title");
    const titles = Array.from(items).slice(0, 5).map(a => a.textContent?.trim()).filter(Boolean);
    return `Found ${items.length} property listings`;
  });

  // 8. iRoko - Events
  await testSite("iRoko Events", "https://www.irokotickets.co.ke/", (dom) => {
    const items = dom.window.document.querySelectorAll(".event-title, h3 a, .card-title");
    const titles = Array.from(items).slice(0, 5).map(a => a.textContent?.trim()).filter(Boolean);
    return `Found ${items.length} events`;
  });

  // 9. FIFA/Football live scores
  await testSite("Livescore", "https://www.livescore.com/en/", (dom) => {
    const scripts = dom.window.document.querySelectorAll("script");
    let dataFound = "No embedded data";
    scripts.forEach(s => {
      if (s.textContent?.includes("initialState") || s.textContent?.includes("__NEXT_DATA__")) {
        dataFound = "Found embedded JSON state!";
      }
    });
    return dataFound;
  });

  console.log("\n\nDone testing! Sites with article links/embedded data can be scraped.");
}

main().catch(console.error);
