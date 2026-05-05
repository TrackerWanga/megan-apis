import { JSDOM } from "jsdom";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function testCourse(url: string, label: string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html" } });
    const html = await res.text();
    const dom = new JSDOM(html, { url: "https://lms.kec.ac.ke/" });
    const doc = dom.window.document;
    
    console.log(`\n=== ${label} ===`);
    console.log(`  URL: ${url}`);
    console.log(`  Size: ${html.length.toLocaleString()} bytes`);
    
    // Find videos (YouTube, Vimeo, mp4)
    const videos = html.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|player\.vimeo\.com\/)[^\s"'<>]+/gi) || [];
    const mp4s = html.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi) || [];
    const pdfs = html.match(/https?:\/\/[^\s"'<>]+\.pdf[^\s"'<>]*/gi) || [];
    
    if (videos.length > 0) console.log(`  📹 Videos: ${videos.length}`);
    if (mp4s.length > 0) console.log(`  🎬 MP4s: ${mp4s.length}`);
    if (pdfs.length > 0) console.log(`  📄 PDFs: ${pdfs.length}`);
    
    // Check for resource links
    const resourceLinks = doc.querySelectorAll("a[href*='resource'], a[href*='mod/resource'], a[href*='mod/url'], a[href*='pluginfile']");
    if (resourceLinks.length > 0) {
      console.log(`  📁 Resources: ${resourceLinks.length}`);
      Array.from(resourceLinks).slice(0, 5).forEach(a => {
        console.log(`    - ${a.textContent?.trim().substring(0, 60)} → ${a.getAttribute("href")?.substring(0, 80)}`);
      });
    }
    
    // Check for activity modules (Moodle)
    const activities = doc.querySelectorAll("a[href*='mod/']");
    console.log(`  📚 Activities: ${activities.length}`);
    if (activities.length > 0) {
      const types = new Set<string>();
      Array.from(activities).forEach(a => {
        const href = a.getAttribute("href") || "";
        const match = href.match(/mod\/([^/]+)/);
        if (match) types.add(match[1]);
      });
      console.log(`  Types: ${[...types].join(", ")}`);
    }
    
    // Check if login is required
    if (html.includes("login") && html.includes("password")) {
      console.log(`  🔒 Login required to access content`);
    } else {
      console.log(`  🔓 Content is publicly accessible`);
    }
    
  } catch (e: any) {
    console.log(`  ❌ Error: ${e.message}`);
  }
  
  await new Promise(r => setTimeout(r, 500));
}

async function main() {
  // Test a course detail page from Form 1 Interactive
  // Try to find actual course links first
  const res = await fetch("https://lms.kec.ac.ke/course/index.php?categoryid=117", {
    headers: { "User-Agent": UA }
  });
  const html = await res.text();
  const dom = new JSDOM(html, { url: "https://lms.kec.ac.ke/" });
  const doc = dom.window.document;
  
  // Get first 3 course links
  const courseLinks = doc.querySelectorAll("a[href*='view.php?id=']");
  const links = Array.from(courseLinks).slice(0, 3);
  
  if (links.length === 0) {
    console.log("No course links found — content may require JavaScript rendering");
    
    // Try direct Moodle course view
    await testCourse("https://lms.kec.ac.ke/course/view.php?id=100", "Direct course test (ID 100)");
    await testCourse("https://lms.kec.ac.ke/course/view.php?id=200", "Direct course test (ID 200)");
    await testCourse("https://lms.kec.ac.ke/course/view.php?id=50", "Direct course test (ID 50)");
    return;
  }
  
  for (const link of links) {
    const href = link.getAttribute("href");
    const title = link.textContent?.trim();
    if (href) {
      await testCourse(href.startsWith("http") ? href : `https://lms.kec.ac.ke${href}`, title || "Untitled Course");
    }
  }
}

main().catch(console.error);
