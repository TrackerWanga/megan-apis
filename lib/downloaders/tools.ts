import { createHash, randomBytes } from "crypto";

export async function getBibleVerse(ref?: string): Promise<{ reference: string; text: string }> {
  const query = ref || "john 3:16";
  const res = await fetch(`https://bible-api.com/${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Bible API returned an error");
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { reference: data.reference, text: data.text.trim() };
}

export function generateQRCode(text: string, size = 300): { url: string; text: string } {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  return { url, text };
}

export function base64Encode(text: string): { encoded: string; original: string } {
  return { encoded: Buffer.from(text).toString("base64"), original: text };
}

export function base64Decode(encoded: string): { decoded: string; original: string } {
  return { decoded: Buffer.from(encoded, "base64").toString("utf-8"), original: encoded };
}

export function textStats(text: string): {
  characters: number; words: number; sentences: number; paragraphs: number; lines: number;
} {
  return {
    characters: text.length,
    words: text.split(/\s+/).filter(Boolean).length,
    sentences: text.split(/[.!?]+/).filter(Boolean).length,
    paragraphs: text.split(/\n\n+/).filter(Boolean).length,
    lines: text.split(/\n/).length,
  };
}

export function generatePassword(length = 16, options?: { uppercase?: boolean; lowercase?: boolean; numbers?: boolean; symbols?: boolean }): { password: string; length: number; strength: string } {
  const opts = { uppercase: true, lowercase: true, numbers: true, symbols: true, ...options };
  let chars = "";
  if (opts.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (opts.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.numbers) chars += "0123456789";
  if (opts.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  const strength = length >= 16 ? "Very Strong" : length >= 12 ? "Strong" : length >= 8 ? "Medium" : "Weak";
  return { password, length, strength };
}

export function loremIpsum(paragraphs = 1): { text: string; paragraphs: number } {
  const sentences = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.",
    "Nulla facilisi morbi tempus iaculis urna id volutpat lacus laoreet.",
    "Viverra accumsan in nisl nisi scelerisque eu ultrices vitae auctor.",
    "Elementum sagittis vitae et leo duis ut diam quam nulla.",
    "Faucibus et molestie ac feugiat sed lectus vestibulum mattis.",
    "Turpis egestas integer eget aliquet nibh praesent tristique magna.",
    "Pellentesque habitant morbi tristique senectus et netus et malesuada fames.",
    "Amet nisl suscipit adipiscing bibendum est ultricies integer quis.",
  ];
  const result: string[] = [];
  for (let p = 0; p < paragraphs; p++) {
    const count = 3 + Math.floor(Math.random() * 4);
    const para: string[] = [];
    for (let s = 0; s < count; s++) {
      para.push(sentences[Math.floor(Math.random() * sentences.length)]);
    }
    result.push(para.join(" "));
  }
  return { text: result.join("\n\n"), paragraphs };
}

export function generateColor(): { hex: string; rgb: { r: number; g: number; b: number }; hsl: { h: number; s: number; l: number } } {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return { hex, rgb: { r, g, b }, hsl: { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) } };
}

export function getTimestamp(): { unix: number; iso: string; utc: string; date: string; time: string } {
  const now = new Date();
  return {
    unix: Math.floor(now.getTime() / 1000),
    iso: now.toISOString(),
    utc: now.toUTCString(),
    date: now.toISOString().split("T")[0],
    time: now.toISOString().split("T")[1].replace("Z", ""),
  };
}

export function urlEncode(text: string): { encoded: string; original: string } {
  return { encoded: encodeURIComponent(text), original: text };
}

export function urlDecode(text: string): { decoded: string; original: string } {
  return { decoded: decodeURIComponent(text), original: text };
}

export function jsonFormat(json: string): { formatted: string; valid: boolean } {
  try {
    const parsed = JSON.parse(json);
    return { formatted: JSON.stringify(parsed, null, 2), valid: true };
  } catch {
    return { formatted: json, valid: false };
  }
}

export function validateEmail(email: string): { valid: boolean; email: string; domain: string } {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const domain = email.split("@")[1] || "";
  return { valid: regex.test(email), email, domain };
}

export function validateIP(ip: string): { valid: boolean; version: string; ip: string } {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ip.split(".").every(n => parseInt(n) >= 0 && parseInt(n) <= 255);
  const ipv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip);
  return { valid: ipv4 || ipv6, version: ipv4 ? "IPv4" : ipv6 ? "IPv6" : "Invalid", ip };
}

export function hashText(text: string, algorithm = "sha256"): { hash: string; algorithm: string; input: string } {
  const hash = createHash(algorithm).update(text).digest("hex");
  return { hash, algorithm, input: text };
}

export async function getDictionary(word: string): Promise<{ word: string; phonetic: string; meanings: any[] }> {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (!res.ok) throw new Error(`Word "${word}" not found`);
  const data = await res.json();
  const entry = data[0];
  return {
    word: entry.word,
    phonetic: entry.phonetic || "",
    meanings: entry.meanings.map((m: any) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: m.definitions.slice(0, 3).map((d: any) => d.definition),
    })),
  };
}

export async function getWikipedia(query: string): Promise<{ title: string; extract: string; url: string }> {
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Wikipedia article not found for "${query}"`);
  const data = await res.json();
  return {
    title: data.title,
    extract: data.extract,
    url: data.content_urls?.desktop?.page || "",
  };
}

export async function getWeather(city: string): Promise<any> {
  const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
  if (!res.ok) throw new Error(`Weather data not found for "${city}"`);
  const data = await res.json();
  const current = data.current_condition?.[0];
  return {
    location: city,
    temperature: `${current?.temp_C}°C / ${current?.temp_F}°F`,
    feelsLike: `${current?.FeelsLikeC}°C / ${current?.FeelsLikeF}°F`,
    humidity: `${current?.humidity}%`,
    description: current?.weatherDesc?.[0]?.value || "",
    windSpeed: `${current?.windspeedKmph} km/h`,
    visibility: `${current?.visibility} km`,
    pressure: `${current?.pressure} mb`,
  };
}

export function uuidGenerate(): { uuid: string } {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return {
    uuid: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`,
  };
}

export function checkPasswordStrength(password: string): { password: string; score: number; strength: string; suggestions: string[] } {
  let score = 0;
  const suggestions: string[] = [];
  if (password.length >= 8) score++; else suggestions.push("Use at least 8 characters");
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password)) score++; else suggestions.push("Add lowercase letters");
  if (/[A-Z]/.test(password)) score++; else suggestions.push("Add uppercase letters");
  if (/[0-9]/.test(password)) score++; else suggestions.push("Add numbers");
  if (/[^a-zA-Z0-9]/.test(password)) score++; else suggestions.push("Add special characters");
  if (!/(.)\1{2,}/.test(password)) score++; else suggestions.push("Avoid repeating characters");
  const strength = score >= 7 ? "Very Strong" : score >= 5 ? "Strong" : score >= 3 ? "Medium" : "Weak";
  return { password: "*".repeat(password.length), score, strength, suggestions };
}

export async function screenshotUrl(url: string): Promise<{ screenshot: string; url: string }> {
  const screenshotUrl = `https://image.thum.io/get/width/1280/${url}`;
  return { screenshot: screenshotUrl, url };
}
