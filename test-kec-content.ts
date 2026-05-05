import { JSDOM } from "jsdom";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function testCategory(id: number, name: string) {
  const url = `https://lms.kec.ac.ke/course/index.php?categoryid=${id}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" } });
  const html = await res.text();
  const dom = new JSDOM(html, { url: "https://lms.kec.ac.ke/" });
  const doc = dom.window.document;
  
  console.log(`\n=== ${name} (ID: ${id}) ===`);
  
  // Look for course listings
  const courseNames: string[] = [];
  
  // Try Moodle course selectors
  doc.querySelectorAll(".coursename a, .course-title a, .coursebox .title a, .aalink").forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 3 && !text.includes("Skip") && !text.includes("Search")) {
      courseNames.push(text);
    }
  });
  
  // Also try finding any Moodle course links
  doc.querySelectorAll("a[href*='view.php?id=']").forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 3) courseNames.push(text);
  });
  
  if (courseNames.length > 0) {
    console.log(`  ✅ Found ${courseNames.length} courses:`);
    courseNames.slice(0, 10).forEach(c => console.log(`    - ${c}`));
  } else {
    // Show what's on the page
    const headings = doc.querySelectorAll("h2, h3, h4");
    console.log(`  ⚠️ No courses found. Page headings:`);
    headings.forEach(h => console.log(`    ${h.textContent?.trim().substring(0, 80)}`));
    
    // Count links
    const links = doc.querySelectorAll("a");
    console.log(`  Total links: ${links.length}`);
  }
  
  await new Promise(r => setTimeout(r, 500));
}

async function main() {
  // Test actual content categories (not just grade levels)
  await testCategory(75, "Grade 1 - Interactive Digital Content");
  await testCategory(76, "Grade 1 - TV Lessons");
  await testCategory(117, "Form 1 - Interactive Digital");
  await testCategory(118, "Form 1 - TV Lessons");
  await testCategory(304, "OER Resources");
  await testCategory(344, "Accessible Digital Textbooks");
  await testCategory(547, "Parental Resources");
}

main().catch(console.error);
