const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function test() {
  const res = await fetch("https://jiji.co.ke/", { headers: { "User-Agent": UA } });
  const html = await res.text();
  
  // Find the application/json script tag
  const jsonMatch = html.match(/<script[^>]*type="application\/json"[^>]*data-nuxt-data[^>]*>([\s\S]*?)<\/script>/);
  
  if (jsonMatch) {
    const rawData = jsonMatch[1];
    console.log("JSON data length:", rawData.length);
    console.log("Preview:", rawData.substring(0, 200));
    
    try {
      const data = JSON.parse(rawData);
      const str = JSON.stringify(data);
      
      // Find images
      const images = str.match(/https:\/\/pictures-kenya\.jijistatic\.com\/[^"?\\]+/g);
      if (images) {
        console.log(`\n✅ Found ${images.length} images`);
        images.slice(0, 5).forEach(i => console.log(" ", i));
      }
      
      // Find ad/listing URLs
      const adUrls = str.match(/"url":"(\/ad\/[^"]+|\/item\/[^"]+)"/g);
      if (adUrls) {
        console.log(`\n✅ Found ${adUrls.length} ad URLs`);
        adUrls.slice(0, 5).forEach(u => console.log(" ", u));
      }
      
      // Find titles
      const titles = str.match(/"title":"([^"]{10,100})"/g);
      if (titles) {
        console.log(`\n✅ Found ${titles.length} searchable titles`);
        titles.slice(0, 5).forEach(t => console.log(" ", t));
      }
      
    } catch (e: any) {
      console.log("Parse error:", e.message);
    }
  } else {
    console.log("No JSON script found");
  }
}

test().catch(console.error);
