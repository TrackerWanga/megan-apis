import { createHash } from "crypto";
import * as dns from "dns";
import * as net from "net";
import * as tls from "tls";
import { promisify } from "util";

const dnsResolve4 = promisify(dns.resolve4);
const dnsResolve6 = promisify(dns.resolve6);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveTxt = promisify(dns.resolveTxt);
const dnsResolveNs = promisify(dns.resolveNs);
const dnsResolveCname = promisify(dns.resolveCname);
const dnsReverse = promisify(dns.reverse);

async function fetchJSON(url: string, timeout = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string, timeout = 8000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function whoisLookup(domain: string): Promise<any> {
  const data = await fetchJSON(`https://api.api-ninjas.com/v1/whois?domain=${encodeURIComponent(domain)}`).catch(() => null);
  if (data && !data.error) return { domain, ...data };
  const rdap = await fetchJSON(`https://rdap.org/domain/${encodeURIComponent(domain)}`).catch(() => null);
  if (rdap) return { domain, name: rdap.ldhName, status: rdap.status, events: rdap.events?.slice(0, 3) };
  return { domain, info: "WHOIS data could not be retrieved. Try a simpler domain." };
}

export async function dnsLookup(domain: string): Promise<any> {
  const results: any = { domain };
  try { results.A = await dnsResolve4(domain); } catch { results.A = []; }
  try { results.AAAA = await dnsResolve6(domain); } catch { results.AAAA = []; }
  try { results.MX = await dnsResolveMx(domain); } catch { results.MX = []; }
  try { results.TXT = (await dnsResolveTxt(domain)).map(r => r.join("")); } catch { results.TXT = []; }
  try { results.NS = await dnsResolveNs(domain); } catch { results.NS = []; }
  try { results.CNAME = await dnsResolveCname(domain); } catch { results.CNAME = []; }
  return results;
}

export async function subdomainScan(domain: string): Promise<any> {
  const common = ["www", "mail", "ftp", "admin", "blog", "dev", "staging", "api", "app", "cdn", "ns1", "ns2", "mx", "vpn", "test", "portal", "shop", "store", "m", "mobile"];
  const found: string[] = [];
  const checks = common.map(async (sub) => {
    try {
      const result = await dnsResolve4(`${sub}.${domain}`);
      if (result.length > 0) found.push(`${sub}.${domain}`);
    } catch {}
  });
  await Promise.all(checks);
  return { domain, subdomains: found, checked: common.length };
}

export async function reverseIp(ip: string): Promise<any> {
  try {
    const hostnames = await dnsReverse(ip);
    return { ip, hostnames };
  } catch {
    return { ip, hostnames: [], note: "No reverse DNS records found" };
  }
}

export async function geoIp(ip: string): Promise<any> {
  return fetchJSON(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
}

export async function portScan(host: string, ports?: number[]): Promise<any> {
  const targetPorts = ports || [21, 22, 25, 53, 80, 110, 143, 443, 993, 995, 3306, 3389, 5432, 8080, 8443];
  const results: { port: number; status: string; service: string }[] = [];
  const serviceMap: Record<number, string> = {
    21: "FTP", 22: "SSH", 25: "SMTP", 53: "DNS", 80: "HTTP", 110: "POP3",
    143: "IMAP", 443: "HTTPS", 993: "IMAPS", 995: "POP3S", 3306: "MySQL",
    3389: "RDP", 5432: "PostgreSQL", 8080: "HTTP-Alt", 8443: "HTTPS-Alt",
  };

  const scanPort = (port: number): Promise<{ port: number; status: string; service: string }> => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.on("connect", () => {
        socket.destroy();
        resolve({ port, status: "open", service: serviceMap[port] || "unknown" });
      });
      socket.on("timeout", () => {
        socket.destroy();
        resolve({ port, status: "filtered", service: serviceMap[port] || "unknown" });
      });
      socket.on("error", () => {
        resolve({ port, status: "closed", service: serviceMap[port] || "unknown" });
      });
      socket.connect(port, host);
    });
  };

  const scanResults = await Promise.all(targetPorts.map(scanPort));
  results.push(...scanResults);
  return { host, ports: results, openPorts: results.filter(r => r.status === "open").length };
}

export async function httpHeaders(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target, { method: "HEAD", redirect: "follow" });
  const headers: Record<string, string> = {};
  res.headers.forEach((value, key) => { headers[key] = value; });
  return { url: target, status: res.status, headers };
}

export async function traceroute(host: string): Promise<any> {
  try {
    const ips = await dnsResolve4(host);
    const geo = await geoIp(ips[0]).catch(() => null);
    return {
      host, resolvedIP: ips[0],
      destination: geo ? { country: geo.country, city: geo.city, isp: geo.isp } : null,
      note: "Full traceroute requires system-level access. Showing DNS resolution and GeoIP data.",
    };
  } catch {
    return { host, error: "Could not resolve host" };
  }
}

export async function asnLookup(ip: string): Promise<any> {
  const data = await geoIp(ip);
  return { ip, asn: data.as, isp: data.isp, org: data.org, country: data.country, city: data.city };
}

export async function pingHost(host: string): Promise<any> {
  const start = Date.now();
  try {
    const ips = await dnsResolve4(host);
    const dnsTime = Date.now() - start;
    const httpStart = Date.now();
    await fetch(`https://${host}`, { method: "HEAD" }).catch(() =>
      fetch(`http://${host}`, { method: "HEAD" })
    );
    const httpTime = Date.now() - httpStart;
    return { host, alive: true, resolvedIP: ips[0], dnsLatency: `${dnsTime}ms`, httpLatency: `${httpTime}ms` };
  } catch {
    return { host, alive: false, dnsLatency: `${Date.now() - start}ms` };
  }
}

export async function latencyCheck(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const times: number[] = [];
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    try {
      await fetch(target, { method: "HEAD" });
      times.push(Date.now() - start);
    } catch {
      times.push(-1);
    }
  }
  const valid = times.filter(t => t >= 0);
  return {
    url: target,
    pings: times.map(t => t >= 0 ? `${t}ms` : "timeout"),
    average: valid.length > 0 ? `${Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)}ms` : "N/A",
    min: valid.length > 0 ? `${Math.min(...valid)}ms` : "N/A",
    max: valid.length > 0 ? `${Math.max(...valid)}ms` : "N/A",
  };
}

export async function sslCheck(host: string): Promise<any> {
  return new Promise((resolve) => {
    const socket = tls.connect(443, host, { servername: host }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve({
        host, valid: socket.authorized,
        issuer: cert.issuer, subject: cert.subject,
        validFrom: cert.valid_from, validTo: cert.valid_to,
        serialNumber: cert.serialNumber,
        protocol: socket.getProtocol(),
      });
    });
    socket.on("error", (err) => {
      resolve({ host, valid: false, error: err.message });
    });
    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve({ host, valid: false, error: "Connection timeout" });
    });
  });
}

export async function tlsInfo(host: string): Promise<any> {
  return new Promise((resolve) => {
    const socket = tls.connect(443, host, { servername: host }, () => {
      const cipher = socket.getCipher();
      const protocol = socket.getProtocol();
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve({
        host, protocol, cipher: cipher?.name, cipherVersion: cipher?.version,
        subject: cert.subject?.CN, issuer: cert.issuer?.O,
        bits: cert.bits, validTo: cert.valid_to,
      });
    });
    socket.on("error", (err) => resolve({ host, error: err.message }));
    socket.setTimeout(5000, () => { socket.destroy(); resolve({ host, error: "Timeout" }); });
  });
}

export async function openPorts(host: string): Promise<any> {
  return portScan(host, [21, 22, 25, 53, 80, 110, 143, 443, 993, 995, 3000, 3306, 3389, 5432, 5900, 8000, 8080, 8443, 8888, 9090]);
}

export async function firewallCheck(host: string): Promise<any> {
  const target = host.startsWith("http") ? host : `https://${host}`;
  try {
    const res = await fetch(target, { method: "HEAD" });
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    const waf = headers["x-powered-by"] || headers["server"] || "Unknown";
    const hasWaf = !!(headers["x-sucuri-id"] || headers["x-cdn"] || headers["cf-ray"] || headers["x-akamai-transformed"]);
    return { host, firewallDetected: hasWaf, server: waf, status: res.status, securityHeaders: {
      xFrameOptions: headers["x-frame-options"] || "Missing",
      xContentType: headers["x-content-type-options"] || "Missing",
      strictTransport: headers["strict-transport-security"] || "Missing",
    }};
  } catch (err: any) {
    return { host, error: err.message };
  }
}

export async function macLookup(mac: string): Promise<any> {
  const clean = mac.replace(/[:-]/g, "").substring(0, 6).toUpperCase();
  try {
    const text = await fetchText(`https://api.macvendors.com/${encodeURIComponent(mac)}`);
    return { mac, vendor: text.trim() };
  } catch {
    return { mac, vendor: "Unknown vendor", prefix: clean };
  }
}

export async function securityHeaders(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target, { method: "HEAD" });
  const h: Record<string, string> = {};
  res.headers.forEach((v, k) => { h[k] = v; });
  const checks = {
    "X-Frame-Options": { value: h["x-frame-options"] || "Missing", secure: !!h["x-frame-options"] },
    "X-Content-Type-Options": { value: h["x-content-type-options"] || "Missing", secure: h["x-content-type-options"] === "nosniff" },
    "Strict-Transport-Security": { value: h["strict-transport-security"] || "Missing", secure: !!h["strict-transport-security"] },
    "Content-Security-Policy": { value: h["content-security-policy"] ? "Present" : "Missing", secure: !!h["content-security-policy"] },
    "X-XSS-Protection": { value: h["x-xss-protection"] || "Missing", secure: !!h["x-xss-protection"] },
    "Referrer-Policy": { value: h["referrer-policy"] || "Missing", secure: !!h["referrer-policy"] },
    "Permissions-Policy": { value: h["permissions-policy"] ? "Present" : "Missing", secure: !!h["permissions-policy"] },
  };
  const score = Object.values(checks).filter(c => c.secure).length;
  return { url: target, score: `${score}/7`, grade: score >= 6 ? "A" : score >= 4 ? "B" : score >= 2 ? "C" : "F", headers: checks };
}

export async function wafDetect(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target, { method: "HEAD" });
  const h: Record<string, string> = {};
  res.headers.forEach((v, k) => { h[k] = v; });
  const detections: string[] = [];
  if (h["cf-ray"]) detections.push("Cloudflare");
  if (h["x-sucuri-id"]) detections.push("Sucuri");
  if (h["x-akamai-transformed"]) detections.push("Akamai");
  if (h["x-cdn"]?.includes("Incapsula")) detections.push("Imperva/Incapsula");
  if (h["server"]?.includes("cloudflare")) detections.push("Cloudflare");
  if (h["server"]?.includes("AkamaiGHost")) detections.push("Akamai");
  if (h["x-powered-by"]?.includes("AWS")) detections.push("AWS WAF");
  if (h["x-amz-cf-id"]) detections.push("AWS CloudFront");
  return { url: target, wafDetected: detections.length > 0, wafs: [...new Set(detections)], server: h["server"] || "Unknown" };
}

export async function robotsCheck(url: string): Promise<any> {
  const base = url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url}`;
  try {
    const text = await fetchText(`${base}/robots.txt`);
    const rules = text.split("\n").filter(l => l.trim() && !l.startsWith("#")).slice(0, 30);
    return { url: `${base}/robots.txt`, found: true, rules, lineCount: text.split("\n").length };
  } catch {
    return { url: `${base}/robots.txt`, found: false, rules: [] };
  }
}

export async function sitemapCheck(url: string): Promise<any> {
  const base = url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url}`;
  try {
    const text = await fetchText(`${base}/sitemap.xml`);
    const urls = (text.match(/<loc>(.*?)<\/loc>/g) || []).map(m => m.replace(/<\/?loc>/g, "")).slice(0, 20);
    return { url: `${base}/sitemap.xml`, found: true, urlCount: urls.length, sampleUrls: urls };
  } catch {
    return { url: `${base}/sitemap.xml`, found: false };
  }
}

export async function cmsDetect(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  try {
    const text = await fetchText(target);
    const detections: string[] = [];
    if (text.includes("wp-content") || text.includes("wp-includes")) detections.push("WordPress");
    if (text.includes("Joomla")) detections.push("Joomla");
    if (text.includes("Drupal")) detections.push("Drupal");
    if (text.includes("shopify")) detections.push("Shopify");
    if (text.includes("wix.com")) detections.push("Wix");
    if (text.includes("squarespace")) detections.push("Squarespace");
    if (text.includes("ghost")) detections.push("Ghost");
    if (text.includes("next/")) detections.push("Next.js");
    if (text.includes("__nuxt")) detections.push("Nuxt.js");
    if (text.includes("gatsby")) detections.push("Gatsby");
    return { url: target, cms: detections.length > 0 ? detections : ["Unknown"], detected: detections.length > 0 };
  } catch (err: any) {
    return { url: target, error: err.message };
  }
}

export async function techStack(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target, { method: "HEAD" });
  const h: Record<string, string> = {};
  res.headers.forEach((v, k) => { h[k] = v; });
  return {
    url: target, server: h["server"] || "Unknown",
    poweredBy: h["x-powered-by"] || "Unknown",
    cdn: h["cf-ray"] ? "Cloudflare" : h["x-amz-cf-id"] ? "AWS CloudFront" : h["x-cdn"] || "None detected",
    language: h["x-powered-by"] || "Unknown",
    framework: h["x-generator"] || "Unknown",
  };
}

export async function cookieScan(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target);
  const cookies = res.headers.getSetCookie?.() || [];
  const parsed = cookies.map(c => {
    const parts = c.split(";").map(p => p.trim());
    const [nameVal, ...attrs] = parts;
    const [name, value] = nameVal.split("=");
    return {
      name, httpOnly: attrs.some(a => a.toLowerCase() === "httponly"),
      secure: attrs.some(a => a.toLowerCase() === "secure"),
      sameSite: attrs.find(a => a.toLowerCase().startsWith("samesite"))?.split("=")?.[1] || "Not set",
    };
  });
  return { url: target, cookieCount: parsed.length, cookies: parsed };
}

export async function redirectCheck(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const chain: { url: string; status: number }[] = [];
  let current = target;
  for (let i = 0; i < 10; i++) {
    const res = await fetch(current, { redirect: "manual" });
    chain.push({ url: current, status: res.status });
    const location = res.headers.get("location");
    if (!location || res.status < 300 || res.status >= 400) break;
    current = location.startsWith("http") ? location : new URL(location, current).href;
  }
  return { url: target, redirects: chain.length - 1, chain };
}

export async function xssCheck(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target, { method: "HEAD" });
  const h: Record<string, string> = {};
  res.headers.forEach((v, k) => { h[k] = v; });
  return {
    url: target,
    xssProtection: h["x-xss-protection"] || "Missing",
    csp: h["content-security-policy"] ? "Present" : "Missing",
    contentType: h["content-type"] || "Missing",
    xContentTypeOptions: h["x-content-type-options"] || "Missing",
    risk: !h["x-xss-protection"] && !h["content-security-policy"] ? "High" : h["content-security-policy"] ? "Low" : "Medium",
  };
}

export async function sqliCheck(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target, { method: "HEAD" });
  const h: Record<string, string> = {};
  res.headers.forEach((v, k) => { h[k] = v; });
  const hasCSP = !!h["content-security-policy"];
  const hasWAF = !!(h["cf-ray"] || h["x-sucuri-id"]);
  return {
    url: target, wafProtected: hasWAF, cspPresent: hasCSP,
    risk: hasWAF ? "Low" : hasCSP ? "Medium" : "High",
    recommendations: [
      ...(!hasWAF ? ["Consider using a Web Application Firewall"] : []),
      ...(!hasCSP ? ["Implement Content Security Policy"] : []),
      "Use parameterized queries", "Sanitize all user inputs",
    ],
  };
}

export async function csrfCheck(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target);
  const text = await res.text();
  const hasToken = text.includes("csrf") || text.includes("_token") || text.includes("authenticity_token");
  const sameSite = res.headers.getSetCookie?.()?.some(c => c.toLowerCase().includes("samesite")) || false;
  return { url: target, csrfTokenFound: hasToken, sameSiteCookies: sameSite, risk: hasToken ? "Low" : "High" };
}

export async function clickjackCheck(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target, { method: "HEAD" });
  const xfo = res.headers.get("x-frame-options");
  const csp = res.headers.get("content-security-policy");
  const frameAncestors = csp?.includes("frame-ancestors");
  return {
    url: target, xFrameOptions: xfo || "Missing", frameAncestors: frameAncestors ? "Present" : "Missing",
    protected: !!(xfo || frameAncestors),
    risk: xfo || frameAncestors ? "Low" : "High",
  };
}

export async function directoryScan(url: string): Promise<any> {
  const base = url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url}`;
  const dirs = ["/admin", "/login", "/wp-admin", "/wp-login.php", "/.env", "/.git", "/api", "/backup", "/config", "/dashboard", "/phpmyadmin", "/server-status", "/.htaccess", "/composer.json", "/package.json"];
  const found: { path: string; status: number }[] = [];
  const checks = dirs.map(async (dir) => {
    try {
      const res = await fetch(`${base}${dir}`, { method: "HEAD", redirect: "follow" });
      if (res.status < 400) found.push({ path: dir, status: res.status });
    } catch {}
  });
  await Promise.all(checks);
  return { url: base, found, checkedPaths: dirs.length };
}

export async function exposedFiles(url: string): Promise<any> {
  const base = url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url}`;
  const files = ["/.env", "/.git/config", "/wp-config.php", "/.htpasswd", "/web.config", "/composer.json", "/package.json", "/.DS_Store", "/thumbs.db", "/crossdomain.xml", "/.svn/entries", "/Dockerfile"];
  const found: { file: string; status: number }[] = [];
  const checks = files.map(async (file) => {
    try {
      const res = await fetch(`${base}${file}`, { method: "HEAD" });
      if (res.status === 200) found.push({ file, status: res.status });
    } catch {}
  });
  await Promise.all(checks);
  return { url: base, exposedFiles: found, risk: found.length > 0 ? "High" : "Low", checkedFiles: files.length };
}

export async function misconfigCheck(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target, { method: "HEAD" });
  const h: Record<string, string> = {};
  res.headers.forEach((v, k) => { h[k] = v; });
  const issues: string[] = [];
  if (!h["strict-transport-security"]) issues.push("Missing HSTS header");
  if (!h["x-content-type-options"]) issues.push("Missing X-Content-Type-Options");
  if (!h["x-frame-options"] && !h["content-security-policy"]?.includes("frame-ancestors")) issues.push("Missing clickjacking protection");
  if (!h["content-security-policy"]) issues.push("Missing Content-Security-Policy");
  if (h["server"]) issues.push(`Server header exposes: ${h["server"]}`);
  if (h["x-powered-by"]) issues.push(`X-Powered-By exposes: ${h["x-powered-by"]}`);
  return { url: target, issues, issueCount: issues.length, risk: issues.length > 4 ? "High" : issues.length > 2 ? "Medium" : "Low" };
}

export function hashIdentify(hash: string): { hash: string; possibleTypes: string[] } {
  const types: string[] = [];
  if (/^[a-f0-9]{32}$/i.test(hash)) types.push("MD5");
  if (/^[a-f0-9]{40}$/i.test(hash)) types.push("SHA-1");
  if (/^[a-f0-9]{64}$/i.test(hash)) types.push("SHA-256");
  if (/^[a-f0-9]{128}$/i.test(hash)) types.push("SHA-512");
  if (/^\$2[aby]?\$\d{2}\$/.test(hash)) types.push("bcrypt");
  if (/^\$argon2/.test(hash)) types.push("Argon2");
  if (types.length === 0) types.push("Unknown");
  return { hash, possibleTypes: types };
}

export function hashGenerate(text: string, algorithm = "sha256"): { input: string; algorithm: string; hash: string } {
  const hash = createHash(algorithm).update(text).digest("hex");
  return { input: text, algorithm, hash };
}

export function passwordStrength(password: string): { score: number; strength: string; length: number; suggestions: string[] } {
  let score = 0;
  const suggestions: string[] = [];
  if (password.length >= 8) score += 2; else suggestions.push("Use at least 8 characters");
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password)) score++; else suggestions.push("Add lowercase letters");
  if (/[A-Z]/.test(password)) score++; else suggestions.push("Add uppercase letters");
  if (/[0-9]/.test(password)) score++; else suggestions.push("Add numbers");
  if (/[^a-zA-Z0-9]/.test(password)) score++; else suggestions.push("Add special characters");
  const strength = score >= 7 ? "Very Strong" : score >= 5 ? "Strong" : score >= 3 ? "Medium" : "Weak";
  return { score, strength, length: password.length, suggestions };
}

export async function urlScan(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const [headersResult, redirectResult] = await Promise.all([
    securityHeaders(target).catch(() => null),
    redirectCheck(target).catch(() => null),
  ]);
  return { url: target, securityHeaders: headersResult, redirects: redirectResult };
}

export async function phishCheck(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const suspicious: string[] = [];
  const domain = new URL(target).hostname;
  if (domain.includes("-")) suspicious.push("Contains hyphens in domain");
  if (domain.split(".").length > 3) suspicious.push("Excessive subdomains");
  if (/\d{4,}/.test(domain)) suspicious.push("Contains long number sequences");
  if (domain.length > 30) suspicious.push("Unusually long domain name");
  const commonBrands = ["paypal", "amazon", "google", "apple", "microsoft", "facebook", "netflix"];
  for (const brand of commonBrands) {
    if (domain.includes(brand) && !domain.endsWith(`${brand}.com`)) {
      suspicious.push(`Contains "${brand}" but is not official domain`);
    }
  }
  try {
    const ssl = await sslCheck(domain) as any;
    if (!ssl.valid) suspicious.push("Invalid SSL certificate");
  } catch {}
  return {
    url: target, domain, suspiciousIndicators: suspicious,
    risk: suspicious.length >= 3 ? "High" : suspicious.length >= 1 ? "Medium" : "Low",
    score: Math.max(0, 100 - suspicious.length * 20),
  };
}

export async function ipInfo(ip: string): Promise<any> {
  return geoIp(ip);
}

export async function metadataExtract(url: string): Promise<any> {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target);
  const text = await res.text();
  const getMetaContent = (name: string) => {
    const match = text.match(new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"));
    return match?.[1] || null;
  };
  const titleMatch = text.match(/<title[^>]*>(.*?)<\/title>/i);
  return {
    url: target,
    title: titleMatch?.[1] || null,
    description: getMetaContent("description") || getMetaContent("og:description"),
    keywords: getMetaContent("keywords"),
    author: getMetaContent("author"),
    ogTitle: getMetaContent("og:title"),
    ogImage: getMetaContent("og:image"),
    ogType: getMetaContent("og:type"),
    twitterCard: getMetaContent("twitter:card"),
  };
}
