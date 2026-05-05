import { JSDOM } from "jsdom";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function test() {
  const res = await fetch("https://www.brightermonday.co.ke/jobs", {
    headers: { "User-Agent": UA, "Accept": "text/html" }
  });
  const html = await res.text();
  const dom = new JSDOM(html, { url: "https://www.brightermonday.co.ke/jobs" });
  const doc = dom.window.document;
  
  const scripts = doc.querySelectorAll("script");
  for (const script of scripts) {
    const text = script.textContent || "";
    if (text.includes('"item_name"') && text.includes('"items"')) {
      const match = text.match(/\{"event":"view_item_list","ecommerce":\{"items":(\[.+?\])\}\}/);
      if (match) {
        const items = JSON.parse(match[1]);
        // Show FULL data for the first job
        console.log("FULL DATA FOR FIRST JOB:");
        console.log(JSON.stringify(items[0], null, 2));
        console.log("\n---\n");
        // Show all available fields across all jobs
        const allFields = new Set<string>();
        items.forEach((item: any) => Object.keys(item).forEach(k => allFields.add(k)));
        console.log("ALL AVAILABLE FIELDS:", [...allFields]);
      }
    }
    
    // Also check for page count / pagination info
    if (text.includes('"total') || text.includes('"count') || text.includes('"results')) {
      console.log("\nPOSSIBLE PAGINATION DATA:");
      console.log(text.substring(0, 500));
    }
  }
  
  // Check meta for total count
  const metaDesc = doc.querySelector('meta[name="description"]');
  if (metaDesc) {
    console.log("\nMETA DESCRIPTION:", metaDesc.getAttribute("content"));
  }
}

test().catch(console.error);
