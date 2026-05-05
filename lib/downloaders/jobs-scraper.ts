import { JSDOM } from "jsdom";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface JobListing {
  id: number;
  title: string;
  company: string;
  location: string;
  category: string;
  industry: string;
  jobType: string;
  experienceLevel: string;
  salaryInfo: string;
  url: string;
}

export async function scrapeKenyaJobs(page = 1): Promise<{
  jobs: JobListing[];
  totalJobs: number;
  page: number;
  perPage: number;
  totalPages: number;
}> {
  const url = page > 1 
    ? `https://www.brightermonday.co.ke/jobs?page=${page}`
    : "https://www.brightermonday.co.ke/jobs";

  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept": "text/html" },
  });

  if (!res.ok) throw new Error(`BrighterMonday returned ${res.status}`);

  const html = await res.text();
  const dom = new JSDOM(html, { url: "https://www.brightermonday.co.ke/jobs" });
  const doc = dom.window.document;

  // Extract total count from meta description
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";
  const totalMatch = metaDesc.match(/out of ([\d,]+)/);
  const totalJobs = totalMatch ? parseInt(totalMatch[1].replace(/,/g, "")) : 0;
  const perPage = 16;
  const totalPages = Math.ceil(totalJobs / perPage);

  // Extract jobs from GTM data layer
  const jobs: JobListing[] = [];
  const scripts = doc.querySelectorAll("script");

  for (const script of scripts) {
    const text = script.textContent || "";
    if (text.includes('"item_name"') && text.includes('"items"')) {
      const match = text.match(/\{"event":"view_item_list","ecommerce":\{"items":(\[.+?\])\}\}/);
      if (match) {
        try {
          const items = JSON.parse(match[1]);
          for (const item of items) {
            jobs.push({
              id: item.item_id,
              title: item.item_name,
              company: item.affiliation || "Confidential",
              location: item.location_id || "Kenya",
              category: item.item_category || "Other",
              industry: item.item_category2 || "General",
              jobType: item.item_category3 || "Full Time",
              experienceLevel: item.item_category4 || "Entry Level",
              salaryInfo: item.item_variant || "Salary not specified",
              url: `https://www.brightermonday.co.ke/listings/${item.item_name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-")}-${item.item_id}`,
            });
          }
        } catch {}
      }
    }
  }

  return { jobs, totalJobs, page, perPage, totalPages };
}
