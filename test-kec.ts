import { JSDOM } from "jsdom";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function test() {
  try {
    const res = await fetch("https://lms.kec.ac.ke/", { 
      headers: { "User-Agent": UA, "Accept": "text/html" },
      signal: AbortSignal.timeout(15000)
    });
    const html = await res.text();
    console.log("Status:", res.status);
    console.log("Size:", html.length.toLocaleString(), "bytes");
    
    const dom = new JSDOM(html, { url: "https://lms.kec.ac.ke/" });
    const doc = dom.window.document;
    
    // What's on the page?
    console.log("\nTitle:", doc.querySelector("title")?.textContent?.trim());
    console.log("Meta desc:", doc.querySelector('meta[name="description"]')?.getAttribute("content"));
    
    // Find all links
    const links = doc.querySelectorAll("a[href]");
    console.log(`\nLinks found: ${links.length}`);
    const linkList = Array.from(links)
      .map(a => ({ text: a.textContent?.trim().substring(0, 80), href: a.getAttribute("href") }))
      .filter(l => l.href && !l.href.startsWith("#") && !l.href.startsWith("javascript"))
      .slice(0, 20);
    linkList.forEach(l => console.log(`  ${l.text} → ${l.href}`));
    
    // Check for login form
    const forms = doc.querySelectorAll("form");
    console.log(`\nForms: ${forms.length}`);
    forms.forEach((f, i) => {
      console.log(`  Form ${i}: action=${f.getAttribute("action")}, method=${f.getAttribute("method")}`);
      f.querySelectorAll("input").forEach(inp => {
        console.log(`    input: name=${inp.getAttribute("name")}, type=${inp.getAttribute("type")}`);
      });
    });
    
    // Check scripts for embedded data
    const scripts = doc.querySelectorAll("script");
    console.log(`\nScripts: ${scripts.length}`);
    scripts.forEach((s, i) => {
      const text = s.textContent || "";
      if (text.length > 100) {
        console.log(`  Script ${i}: ${text.length} chars`);
        if (text.includes("course") || text.includes("login") || text.includes("user")) {
          console.log(`    Contains relevant keywords`);
        }
      }
    });
    
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}

test().catch(console.error);
