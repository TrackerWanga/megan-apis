const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function test() {
  const res = await fetch("https://jiji.co.ke/", { headers: { "User-Agent": UA } });
  const html = await res.text();
  
  // Find the script with __NUXT__
  const scriptMatch = html.match(/<script>window\.__NUXT__=([\s\S]*?)<\/script>/);
  
  if (scriptMatch) {
    const rawData = scriptMatch[1];
    console.log("Data length:", rawData.length);
    
    // Parse it
    try {
      const data = JSON.parse(rawData);
      
      // Explore the structure
      console.log("Top keys:", Object.keys(data));
      
      // Go deeper
      if (data.state) {
        console.log("state keys:", Object.keys(data.state).slice(0, 20));
      }
      if (data.data) {
        console.log("data keys:", Object.keys(data.data).slice(0, 20));
      }
      
      // Search for listing-like data anywhere
      const str = JSON.stringify(data);
      
      // Find images
      const images = str.match(/https:\/\/pictures-kenya\.jijistatic\.com\/[^"?\s]+/g);
      if (images) {
        console.log(`\n✅ Found ${images.length} images`);
        console.log("Sample:", images[0]);
      }
      
      // Find titles
      const titles = str.match(/"title":"([^"]{10,100})"/g);
      if (titles) {
        console.log(`\n✅ Found ${titles.length} titles`);
        titles.slice(0, 5).forEach(t => console.log(" ", t));
      }
      
      // Find slugs/URLs  
      const slugs = str.match(/"slug":"([^"]+)"/g);
      if (slugs) {
        console.log(`\n✅ Found ${slugs.length} slugs`);
        slugs.slice(0, 5).forEach(s => console.log(" ", s));
      }
      
    } catch (e: any) {
      console.log("Parse error:", e.message);
      console.log("First 300 chars:", rawData.substring(0, 300));
    }
  } else {
    console.log("No __NUXT__ script found");
    // Show all script tag beginnings
    const scripts = html.match(/<script[^>]*>/g);
    console.log("Script tags found:", scripts?.length);
    if (scripts) scripts.slice(0, 5).forEach((s, i) => console.log(`  ${i}: ${s.substring(0, 80)}`));
  }
}

test().catch(console.error);
