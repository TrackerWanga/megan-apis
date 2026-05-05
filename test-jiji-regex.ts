const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function test() {
  const res = await fetch("https://jiji.co.ke/", { headers: { "User-Agent": UA } });
  const html = await res.text();
  
  // Find the __NUXT__ script tag
  const match = html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  
  if (match) {
    console.log("Found __NUXT__ data:", match[1].substring(0, 200));
    
    try {
      const data = JSON.parse(match[1]);
      const str = JSON.stringify(data);
      
      // Find all listing-like data
      const titleMatches = str.match(/"title":"([^"]{5,100})"/g)?.slice(0, 10) || [];
      const priceMatches = str.match(/"price(?:__display)?":"([^"]+)"/g)?.slice(0, 10) || [];
      const urlMatches = str.match(/"url":"(\/[^"]+)"/g)?.slice(0, 10) || [];
      const imgMatches = str.match(/"image_url":"([^"]+)"/g)?.slice(0, 10) || [];
      const slugMatches = str.match(/"slug":"([^"]+)"/g)?.slice(0, 10) || [];
      
      console.log("\nTITLES:", titleMatches.length);
      titleMatches.forEach(t => console.log(" ", t));
      
      console.log("\nPRICES:", priceMatches.length);
      priceMatches.forEach(p => console.log(" ", p));
      
      console.log("\nURLS:", urlMatches.length);
      urlMatches.forEach(u => console.log(" ", u));
      
      console.log("\nIMAGES:", imgMatches.length);
      imgMatches.forEach(i => console.log(" ", i));
      
      console.log("\nSLUGS:", slugMatches.length);
      slugMatches.forEach(s => console.log(" ", s));
      
      // Also check for listing objects directly
      if (str.includes('"listing_id"') || str.includes('"advert_id"') || str.includes('"item_id"')) {
        console.log("\n✅ Found listing IDs in data!");
        // Show one full listing
        const listingMatch = str.match(/\{"title":"[^"]+","slug":"[^"]+","price":[^}]+\}/);
        if (listingMatch) console.log("Sample listing:", listingMatch[0]);
      }
      
    } catch (e: any) {
      console.log("Parse error:", e.message);
      console.log("Data preview:", match[1].substring(0, 500));
    }
  } else {
    console.log("No __NUXT__ found with regex");
  }
}

test().catch(console.error);
