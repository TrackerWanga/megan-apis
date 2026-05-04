import axios, { AxiosRequestConfig } from "axios";
import * as cheerio from "cheerio";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/131.0.0.0 Safari/537.36",
];

const TECH_SIGNATURES: Record<string, string[]> = {
  "Cloudflare": ["cf-ray", "__cf_bm", "cloudflare"],
  "React": ["react", "_reactRoot", "__REACT_DEVTOOLS_GLOBAL_HOOK__"],
  "Next.js": ["__NEXT_DATA__", "__next", "next/"],
  "Vue.js": ["vue", "__vue__", "data-v-"],
  "Angular": ["ng-version", "ng-app", "angular"],
  "jQuery": ["jquery"],
  "WordPress": ["wp-content", "wp-includes", "wordpress"],
  "Shopify": ["shopify", "myshopify"],
  "Bootstrap": ["bootstrap"],
  "Tailwind": ["tailwindcss", "tailwind"],
  "Google Analytics": ["google-analytics", "gtag", "ga.js"],
  "Stripe": ["stripe.com", "js.stripe.com"],
  "Vercel": ["x-vercel", "vercel"],
  "Netlify": ["netlify"],
  "Nginx": ["server: nginx"],
  "Apache": ["server: apache"],
  "Laravel": ["laravel"],
  "Django": ["django", "csrftoken"],
  "Ruby on Rails": ["rails"],
  "Express": ["x-powered-by: express"],
};

export interface ScrapeOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  cookies?: string;
  proxy?: string;
  followRedirects?: boolean;
  maxRedirects?: number;
  timeout?: number;
  extractImages?: boolean;
  extractScripts?: boolean;
  extractStyles?: boolean;
  extractForms?: boolean;
  extractTables?: boolean;
  extractEmails?: boolean;
  extractPhones?: boolean;
  extractSocial?: boolean;
  detectTech?: boolean;
  returnRaw?: boolean;
}

export interface ScrapeResult {
  url: string;
  finalUrl?: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  
  // Page
  title?: string;
  description?: string;
  meta?: Record<string, string>;
  
  // Resources
  links?: { href: string; text: string; internal: boolean; external: boolean; nofollow: boolean }[];
  images?: { src: string; alt: string; width?: string; height?: string; loading?: string }[];
  scripts?: { src?: string; inline: boolean; length: number }[];
  styles?: { src?: string; inline: boolean; length: number }[];
  forms?: { action: string; method: string; enctype: string; fields: { name: string; type: string; placeholder?: string; value?: string; required: boolean }[] }[];
  tables?: { caption?: string; headers: string[]; rows: string[][]; rowCount: number }[];

  // Extracted data
  emails?: string[];
  phones?: string[];
  socialLinks?: { twitter?: string; facebook?: string; instagram?: string; linkedin?: string; github?: string; youtube?: string; whatsapp?: string; telegram?: string };

  // Security
  security?: {
    hasCloudflare: boolean;
    hasCaptcha: boolean;
    csp?: string;
    xFrameOptions?: string;
    hsts?: string;
    cookies: { name: string; value?: string; httpOnly: boolean; secure: boolean; sameSite?: string; path?: string; domain?: string }[];
  };

  // Technology
  tech?: string[];

  // Cookies string for next request
  cookieString?: string;

  // Raw HTML
  rawHtml?: string;
  
  // Stats
  stats: {
    linksCount: number;
    imagesCount: number;
    scriptsCount: number;
    stylesCount: number;
    formsCount: number;
    tablesCount: number;
    emailsCount: number;
    phonesCount: number;
    bodySize: number;
    fetchTime: string;
  };
}

export async function masterScrape(inputUrl: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const startTime = Date.now();
  const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  const axiosConfig: AxiosRequestConfig = {
    method: options.method || "GET",
    url: inputUrl,
    headers: {
      "User-Agent": options.headers?.["User-Agent"] || randomUA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "no-cache",
      ...(options.headers || {}),
    },
    timeout: options.timeout || 30000,
    maxRedirects: options.maxRedirects ?? 5,
    validateStatus: () => true, // Accept all status codes
    responseType: "text",
    transformResponse: [(data) => data], // Don't parse JSON
  };

  // Add cookies
  if (options.cookies) {
    axiosConfig.headers!["Cookie"] = options.cookies;
  }

  // Add body for POST
  if (options.method === "POST" && options.body) {
    axiosConfig.data = options.body;
  }

  // Add proxy
  if (options.proxy) {
    axiosConfig.proxy = {
      protocol: "http",
      host: new URL(options.proxy).hostname,
      port: parseInt(new URL(options.proxy).port),
    };
  }

  // Fetch the page
  const response = await axios(axiosConfig);
  const html: string = typeof response.data === "string" ? response.data : String(response.data);
  const $ = cheerio.load(html);
  const fetchTime = `${Date.now() - startTime}ms`;

  const allHeaders: Record<string, string> = {};
  if (response.headers) {
    Object.entries(response.headers).forEach(([k, v]) => { allHeaders[k] = String(v); });
  }

  // Parse cookies from response
  const setCookies = response.headers["set-cookie"] || [];
  const cookieArray = (Array.isArray(setCookies) ? setCookies : [setCookies]).map(c => String(c));
  
  const parsedCookies = cookieArray.map(c => {
    const parts = c.split(";").map(p => p.trim());
    const [nameVal, ...attrs] = parts;
    const [name, value] = nameVal.split("=");
    const attrMap: Record<string, string> = {};
    for (const attr of attrs) {
      const [k, v] = attr.split("=");
      if (k) attrMap[k.trim().toLowerCase()] = (v || "").trim();
    }
    return {
      name,
      value: value || undefined,
      httpOnly: "httponly" in attrMap,
      secure: "secure" in attrMap,
      sameSite: attrMap["samesite"],
      path: attrMap["path"] || "/",
      domain: attrMap["domain"],
    };
  });

  const cookieString = cookieArray.join("; ");

  // ─── Extract Links ─────────────────────────────────────────────────────
  const links: ScrapeResult["links"] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim().substring(0, 150);
    const rel = ($(el).attr("rel") || "").toLowerCase();
    try {
      const fullUrl = new URL(href, inputUrl).href;
      const internal = new URL(fullUrl).hostname === new URL(inputUrl).hostname;
      links!.push({ href: fullUrl, text: text || "(no text)", internal, external: !internal, nofollow: rel.includes("nofollow") });
    } catch {}
  });

  // ─── Extract Images ─────────────────────────────────────────────────────
  const images: ScrapeResult["images"] = [];
  if (options.extractImages !== false) {
    $("img[src]").each((_, el) => {
      const src = $(el).attr("src") || "";
      const alt = $(el).attr("alt") || "";
      try {
        images!.push({
          src: src.startsWith("http") ? src : (src.startsWith("//") ? "https:" + src : new URL(src, inputUrl).href),
          alt: alt.substring(0, 200),
          width: $(el).attr("width") || undefined,
          height: $(el).attr("height") || undefined,
          loading: $(el).attr("loading") || undefined,
        });
      } catch {}
    });
  }

  // ─── Extract Scripts ────────────────────────────────────────────────────
  const scripts: ScrapeResult["scripts"] = [];
  if (options.extractScripts !== false) {
    $("script").each((_, el) => {
      const src = $(el).attr("src");
      const inline = $(el).html() || "";
      if (src) {
        try {
          scripts!.push({ src: src.startsWith("http") ? src : new URL(src, inputUrl).href, inline: false, length: 0 });
        } catch {}
      } else if (inline.trim()) {
        scripts!.push({ inline: true, length: inline.length });
      }
    });
  }

  // ─── Extract Styles ─────────────────────────────────────────────────────
  const styles: ScrapeResult["styles"] = [];
  if (options.extractStyles !== false) {
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        try {
          styles!.push({ src: href.startsWith("http") ? href : new URL(href, inputUrl).href, inline: false, length: 0 });
        } catch {}
      }
    });
    $("style").each((_, el) => {
      const inline = $(el).html() || "";
      if (inline.trim()) styles!.push({ inline: true, length: inline.length });
    });
  }

  // ─── Extract Forms ──────────────────────────────────────────────────────
  const forms: ScrapeResult["forms"] = [];
  if (options.extractForms !== false) {
    $("form").each((_, el) => {
      const action = $(el).attr("action") || "";
      const method = ($(el).attr("method") || "GET").toUpperCase();
      const enctype = $(el).attr("enctype") || "application/x-www-form-urlencoded";
      const fields: ScrapeResult["forms"][0]["fields"] = [];
      $(el).find("input, select, textarea, button").each((_, field) => {
        const tag = $(field).prop("tagName")?.toLowerCase() || "input";
        const type = $(field).attr("type") || (tag === "select" ? "select" : tag === "textarea" ? "textarea" : "text");
        const name = $(field).attr("name") || "";
        if (name || type === "submit") {
          fields.push({
            name,
            type,
            placeholder: $(field).attr("placeholder"),
            value: $(field).attr("value"),
            required: $(field).attr("required") !== undefined,
          });
        }
      });
      try {
        forms!.push({ action: action ? new URL(action, inputUrl).href : inputUrl, method, enctype, fields });
      } catch {}
    });
  }

  // ─── Extract Tables ─────────────────────────────────────────────────────
  const tables: ScrapeResult["tables"] = [];
  if (options.extractTables !== false) {
    $("table").each((_, el) => {
      const headers: string[] = [];
      $(el).find("thead th, thead td, tr:first-child th").each((_, th) => headers.push($(th).text().trim()));
      const rows: string[][] = [];
      $(el).find("tbody tr, tr").each((_, tr) => {
        const row: string[] = [];
        $(tr).find("td, th").each((_, td) => row.push($(td).text().trim()));
        if (row.length > 0) rows.push(row);
      });
      tables!.push({ caption: $(el).find("caption").text().trim() || undefined, headers, rows, rowCount: rows.length });
    });
  }

  // ─── Extract Emails ─────────────────────────────────────────────────────
  const emails: string[] = [];
  if (options.extractEmails !== false) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const found = html.match(emailRegex) || [];
    emails.push(...new Set(found));
  }

  // ─── Extract Phones ─────────────────────────────────────────────────────
  const phones: string[] = [];
  if (options.extractPhones !== false) {
    const phoneRegex = /(?:\+254|0)[17]\d{8}|(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g;
    const found = html.match(phoneRegex) || [];
    phones.push(...new Set(found));
  }

  // ─── Extract Social Links ───────────────────────────────────────────────
  const socialLinks: ScrapeResult["socialLinks"] = {};
  if (options.extractSocial !== false) {
    const socialPatterns: Record<string, RegExp> = {
      twitter: /twitter\.com\/([a-zA-Z0-9_]+)/,
      facebook: /facebook\.com\/([a-zA-Z0-9.]+)/,
      instagram: /instagram\.com\/([a-zA-Z0-9_.]+)/,
      linkedin: /linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/,
      github: /github\.com\/([a-zA-Z0-9_-]+)/,
      youtube: /youtube\.com\/@([a-zA-Z0-9_-]+)/,
      whatsapp: /whatsapp\.com\/channel\/([a-zA-Z0-9]+)/,
      telegram: /t\.me\/([a-zA-Z0-9_]+)/,
    };
    const allHrefs = $("a[href]").map((_, el) => $(el).attr("href") || "").get();
    for (const [platform, regex] of Object.entries(socialPatterns)) {
      for (const href of allHrefs) {
        const match = href.match(regex);
        if (match) {
          (socialLinks as any)[platform] = href.startsWith("http") ? href : `https://${href.replace(/^\/\//, "")}`;
          break;
        }
      }
    }
  }

  // ─── Security Detection ─────────────────────────────────────────────────
  const security: ScrapeResult["security"] = {
    hasCloudflare: !!allHeaders["cf-ray"] || !!allHeaders["server"]?.includes("cloudflare") || html.includes("cloudflare"),
    hasCaptcha: html.includes("captcha") || html.includes("g-recaptcha") || html.includes("h-captcha"),
    csp: allHeaders["content-security-policy"],
    xFrameOptions: allHeaders["x-frame-options"],
    hsts: allHeaders["strict-transport-security"],
    cookies: parsedCookies,
  };

  // ─── Technology Detection ───────────────────────────────────────────────
  const tech: string[] = [];
  if (options.detectTech !== false) {
    const allText = html.toLowerCase() + " " + Object.entries(allHeaders).map(([k, v]) => `${k}: ${v}`).join(" ").toLowerCase();
    for (const [name, signatures] of Object.entries(TECH_SIGNATURES)) {
      if (signatures.some(sig => allText.includes(sig.toLowerCase()))) {
        tech.push(name);
      }
    }
  }

  // ─── Meta ───────────────────────────────────────────────────────────────
  const meta: Record<string, string> = {};
  $("meta[name], meta[property]").each((_, el) => {
    const name = $(el).attr("name") || $(el).attr("property") || "";
    const content = $(el).attr("content") || "";
    if (name && content) meta[name] = content.substring(0, 300);
  });

  return {
    url: inputUrl,
    finalUrl: response.request?.res?.responseUrl !== inputUrl ? response.request?.res?.responseUrl : undefined,
    status: response.status,
    statusText: response.statusText,
    headers: allHeaders,
    title: $("title").text().trim() || undefined,
    description: meta.description || meta["og:description"] || undefined,
    meta: Object.keys(meta).length > 0 ? meta : undefined,
    links: links.length > 0 ? links : undefined,
    images: images.length > 0 ? images : undefined,
    scripts: scripts.length > 0 ? scripts : undefined,
    styles: styles.length > 0 ? styles : undefined,
    forms: forms.length > 0 ? forms : undefined,
    tables: tables.length > 0 ? tables : undefined,
    emails: emails.length > 0 ? emails : undefined,
    phones: phones.length > 0 ? phones : undefined,
    socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
    security,
    tech: tech.length > 0 ? tech : undefined,
    cookieString: cookieString || undefined,
    rawHtml: options.returnRaw ? html.substring(0, 500000) : undefined,
    stats: {
      linksCount: links.length,
      imagesCount: images.length,
      scriptsCount: scripts.length,
      stylesCount: styles.length,
      formsCount: forms.length,
      tablesCount: tables.length,
      emailsCount: emails.length,
      phonesCount: phones.length,
      bodySize: html.length,
      fetchTime,
    },
  };
}
