import { JSDOM } from "jsdom";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function test(categoryId: number, name: string) {
  const res = await fetch(`https://lms.kec.ac.ke/course/index.php?categoryid=${categoryId}`, {
    headers: { "User-Agent": UA, "Accept": "text/html" }
  });
  const html = await res.text();
  const dom = new JSDOM(html, { url: "https://lms.kec.ac.ke/" });
  const doc = dom.window.document;
  
  console.log(`\n=== ${name} (${html.length.toLocaleString()} bytes) ===`);
  
  // Try multiple selectors
  const selectors = [
    ".coursebox", ".course-listitem", ".course-item",
    "[class*='course']", ".coursename", ".course-title",
    "tr[class*='course']", ".course-content"
  ];
  
  for (const sel of selectors) {
    const items = doc.querySelectorAll(sel);
    if (items.length > 0) {
      console.log(`  Selector "${sel}": ${items.length} items`);
      items.forEach((item, i) => {
        if (i < 5) {
          const name = item.querySelector("a")?.textContent?.trim() || item.textContent?.trim().substring(0, 80);
          const link = item.querySelector("a")?.getAttribute("href");
          console.log(`    ${i+1}. ${name} → ${link}`);
        }
      });
      break;
    }
  }
  
  // Also try finding any links with "view.php" or "course"
  const courseLinks = doc.querySelectorAll("a[href*='view.php'], a[href*='course']");
  console.log(`\n  Course links found: ${courseLinks.length}`);
  Array.from(courseLinks).slice(0, 5).forEach(a => {
    console.log(`    ${a.textContent?.trim().substring(0, 80)} → ${a.getAttribute("href")}`);
  });
}

async function main() {
  await test(74, "Grade 1");
  await test(94, "Grade 5");
  await test(113, "Form 1");
}

main().catch(console.error);
