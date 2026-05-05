import { JSDOM } from "jsdom";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function getSubCategories(categoryId: number, name: string) {
  const res = await fetch(`https://lms.kec.ac.ke/course/index.php?categoryid=${categoryId}`, {
    headers: { "User-Agent": UA, "Accept": "text/html" }
  });
  const html = await res.text();
  const dom = new JSDOM(html, { url: "https://lms.kec.ac.ke/" });
  const doc = dom.window.document;
  
  const subCats: { name: string; id: number }[] = [];
  
  // Find category links in the breadcrumb/sidebar
  doc.querySelectorAll("a[href*='categoryid=']").forEach(a => {
    const href = a.getAttribute("href") || "";
    const match = href.match(/categoryid=(\d+)/);
    const text = a.textContent?.trim();
    if (match && text && parseInt(match[1]) !== categoryId && text.length > 2) {
      const id = parseInt(match[1]);
      if (!subCats.find(s => s.id === id)) {
        subCats.push({ name: text, id });
      }
    }
  });
  
  if (subCats.length > 0) {
    console.log(`\n${name} (ID: ${categoryId}) — ${subCats.length} sub-categories:`);
    subCats.forEach(s => console.log(`  ${s.name} → categoryid=${s.id}`));
  }
}

async function main() {
  // Grade levels we found
  const categories = [
    { id: 74, name: "Grade 1" },
    { id: 90, name: "Grade 3" },
    { id: 94, name: "Grade 5" },
    { id: 113, name: "Form 1" },
    { id: 116, name: "Form 4" },
  ];
  
  for (const cat of categories) {
    await getSubCategories(cat.id, cat.name);
    await new Promise(r => setTimeout(r, 500)); // Be polite
  }
}

main().catch(console.error);
