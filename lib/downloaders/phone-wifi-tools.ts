import { parsePhoneNumber, isValidNumber, formatNumber } from "libphonenumber-js";
import { execSync } from "child_process";
import dns from "dns";
import { promisify } from "util";

const dnsResolve4 = promisify(dns.resolve4);
const dnsResolveMx = promisify(dns.resolveMx);
const dnsResolveNs = promisify(dns.resolveNs);
const dnsResolveTxt = promisify(dns.resolveTxt);

// ─── 1. Phone Number Lookup ──────────────────────────────────────────────
export function phoneLookup(phone: string) {
  try {
    const parsed = parsePhoneNumber(phone, { defaultCallingCode: "254", defaultCountry: "KE" });
    
    if (!parsed) {
      return { valid: false, error: "Could not parse phone number. Use international format: +254XXXXXXXXX" };
    }

    const valid = isValidNumber(phone);
    
    if (!valid) {
      return { valid: false, error: "Phone number is not valid", country: parsed.country };
    }

    const carriers: Record<string, string> = {
      "KE": "Safaricom or Airtel or Telkom Kenya",
      "NG": "MTN or Glo or Airtel or 9mobile",
      "ZA": "Vodacom or MTN or Cell C or Telkom",
      "US": "AT&T or Verizon or T-Mobile",
      "GB": "EE or Vodafone or O2 or Three",
      "IN": "Jio or Airtel or Vi or BSNL",
      "GH": "MTN Ghana or Vodafone Ghana or AirtelTigo",
      "TZ": "Vodacom Tanzania or Tigo or Airtel or Halotel",
      "UG": "MTN Uganda or Airtel Uganda",
    };

    const numberType = parsed.getType?.() || "Unknown";
    
    return {
      valid: true,
      country: parsed.country,
      countryCallingCode: parsed.countryCallingCode,
      nationalNumber: parsed.number?.nationalNumber || phone,
      internationalFormat: formatNumber(parsed, "INTERNATIONAL") || phone,
      nationalFormat: formatNumber(parsed, "NATIONAL") || phone,
      possible: parsed.isPossible?.() ?? true,
      carriersInCountry: carriers[parsed.country || ""] || "Multiple carriers",
    };
  } catch (e: any) {
    return { valid: false, error: e.message || "Failed to parse phone number" };
  }
}

// ─── 2. Password Auditor ──────────────────────────────────────────────────
const COMMON_PASSWORDS = [
  "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567",
  "letmein", "trustno1", "dragon", "baseball", "iloveyou", "master", "admin",
  "123456789", "football", "welcome", "shadow", "sunshine", "password1",
  "1234567890", "123123", "654321", "superman", "qazwsx", "michael", "princess",
  "safaricom", "airtel", "vodafone", "mtn", "jesus", "bible", "qwerty123",
];

const BREACH_PATTERNS = [
  { pattern: /password|123456|qwerty|abc123/i, message: "Extremely common password found in every breach list" },
  { pattern: /^(19|20)\d{2}$/, message: "Year-based passwords are easily guessed" },
  { pattern: /^[A-Z][a-z]+$/, message: "Single dictionary word — crackable in milliseconds" },
  { pattern: /^[A-Z][a-z]+\d{1,3}$/, message: "Word + numbers pattern — very common in breaches" },
];

export function passwordAudit(password: string) {
  const length = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  let score = 0;
  if (length >= 8) score++;
  if (length >= 12) score++;
  if (length >= 16) score++;
  if (hasLower) score++;
  if (hasUpper) score++;
  if (hasDigit) score++;
  if (hasSpecial) score++;

  const strength = score >= 6 ? "Very Strong" : score >= 4 ? "Strong" : score >= 3 ? "Moderate" : score >= 2 ? "Weak" : "Very Weak";

  const findings: string[] = [];
  if (COMMON_PASSWORDS.some(cp => password.toLowerCase().includes(cp))) {
    findings.push("Contains a common password pattern");
  }
  for (const bp of BREACH_PATTERNS) {
    if (bp.pattern.test(password)) findings.push(bp.message);
  }
  if (length < 8) findings.push("Too short — use at least 8 characters");
  if (!hasSpecial) findings.push("No special characters — add symbols like !@#$%");

  const timeToCrack = strength === "Very Weak" ? "Instantly" :
    strength === "Weak" ? "Few seconds" :
    strength === "Moderate" ? "Hours to days" :
    strength === "Strong" ? "Months to years" : "Centuries";

  return {
    password: "*".repeat(length),
    length,
    strength,
    score: `${score}/7`,
    hasLower, hasUpper, hasDigit, hasSpecial,
    findings: findings.length > 0 ? findings : ["No obvious weaknesses detected"],
    timeToCrack,
    appearsInTop10k: COMMON_PASSWORDS.some(cp => password.toLowerCase() === cp.toLowerCase()),
  };
}

// ─── 3. DNS Inspector ────────────────────────────────────────────────────
export async function dnsInspector(domain: string) {
  const clean = domain.replace(/https?:\/\//, "").replace(/\/.*/, "").trim();
  
  const results: any = { domain: clean };
  
  try { results.A = await dnsResolve4(clean); } catch { results.A = null; }
  try { results.MX = await dnsResolveMx(clean); } catch { results.MX = null; }
  try { results.NS = await dnsResolveNs(clean); } catch { results.NS = null; }
  try {
    const txt = await dnsResolveTxt(clean);
    results.TXT = txt.map(t => t.join(""));
  } catch { results.TXT = null; }

  const txtRecords = results.TXT || [];
  const spfRecord = txtRecords.find((r: string) => r.startsWith("v=spf1"));
  const dmarcRecord = txtRecords.find((r: string) => r.startsWith("v=DMARC1"));
  const dkimRecord = txtRecords.some((r: string) => r.includes("dkim"));

  let securityScore = 0;
  if (spfRecord) securityScore++;
  if (dmarcRecord) securityScore++;
  if (dkimRecord) securityScore++;
  if (results.A && results.A.length > 0) securityScore++;

  let mailProvider = "Unknown";
  if (results.MX) {
    const mxHosts = results.MX.map((m: any) => m.exchange.toLowerCase()).join(" ");
    if (mxHosts.includes("google") || mxHosts.includes("gmail")) mailProvider = "Google Workspace";
    else if (mxHosts.includes("outlook") || mxHosts.includes("protection.outlook")) mailProvider = "Microsoft 365";
    else if (mxHosts.includes("zoho")) mailProvider = "Zoho";
  }

  let grade = "F";
  if (securityScore >= 4) grade = "A+";
  else if (securityScore === 3) grade = "A";
  else if (securityScore === 2) grade = "B";

  return {
    ...results,
    spf: !!spfRecord,
    dmarc: !!dmarcRecord,
    dkim: dkimRecord,
    mailProvider,
    securityScore: `${securityScore}/4`,
    grade,
    recommendations: [
      !spfRecord && "Add SPF record to prevent email spoofing",
      !dmarcRecord && "Add DMARC record for email authentication",
      !dkimRecord && "Add DKIM signing for email integrity",
    ].filter(Boolean),
  };
}

// ─── 4. WiFi Network Scanner ──────────────────────────────────────────────
export function wifiScan(): any {
  try {
    const platform = process.platform;
    let output = "";

    if (platform === "linux") {
      output = execSync("nmcli -t -f SSID,BSSID,SIGNAL,CHAN,SECURITY dev wifi list 2>/dev/null || echo ''", {
        timeout: 5000,
      }).toString();
    } else if (platform === "win32") {
      output = execSync("netsh wlan show networks mode=Bssid 2>nul", {
        timeout: 5000,
      }).toString();
    } else if (platform === "darwin") {
      output = execSync("/System/Library/PrivateFrameworks/Apple80211.framework/Resources/airport -s 2>/dev/null || echo ''", {
        timeout: 5000,
      }).toString();
    }

    if (!output.trim()) {
      return {
        available: false,
        message: `WiFi scanning not available on this server. Only works on devices with WiFi cards. Platform: ${platform}`,
      };
    }

    const networks: any[] = [];
    if (platform === "linux") {
      const lines = output.trim().split("\n");
      for (const line of lines) {
        const parts = line.split(":");
        if (parts.length >= 5) {
          networks.push({
            ssid: parts[1] || "Hidden",
            bssid: parts[2] || "Unknown",
            signal: parts[3] ? `${parts[3]}%` : "Unknown",
            channel: parts[4] || "Unknown",
            security: parts[5] || "Unknown",
          });
        }
      }
    }

    return {
      available: networks.length > 0,
      networks,
      platform,
      note: "This only shows networks visible to the server, not your device.",
    };
  } catch (e: any) {
    return {
      available: false,
      error: e.message,
      message: "WiFi scanning requires a physical WiFi adapter on the server.",
    };
  }
}
