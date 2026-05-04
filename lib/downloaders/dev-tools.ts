import vm from "node:vm";
import { createHash } from "crypto";

// ─── 1. Deobfuscate JavaScript ───────────────────────────────────────────
export function deobfuscate(code: string): string {
  // Strategy: Execute obfuscated code in a sandbox to extract the real values
  const sandbox: any = {
    console: { log: () => {}, error: () => {}, warn: () => {} },
    setTimeout: () => {},
    setInterval: () => {},
    document: { createElement: () => ({}), getElementById: () => ({}), querySelector: () => ({}), body: {}, addEventListener: () => {} },
    window: {},
    global: {},
    process: { env: {} },
    require: () => ({}),
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;

  try {
    vm.createContext(sandbox);
    
    // Extract string literals and rename variables
    let deobfuscated = code
      // Extract and replace hex/unicode escapes
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      
      // Try to resolve _0x-style variable names by running the array extraction
      .replace(/var\s+(_0x[a-f0-9]+)\s*=\s*(\[[^\]]+\])/g, (match, varName, arrayStr) => {
        try {
          const arr = vm.runInContext(arrayStr, sandbox);
          sandbox[varName] = arr;
          return `// Decoded: ${varName} = [${arr.map((s: string) => `"${s}"`).join(", ")}]\nvar ${varName} = [${arr.map((s: string) => `"${s}"`).join(", ")}]`;
        } catch {
          return match;
        }
      })
      
      // Replace common _0x access patterns
      .replace(/(_0x[a-f0-9]+)\[(\d+)\]/g, (match, arrName, index) => {
        const arr = sandbox[arrName];
        if (arr && arr[parseInt(index)]) {
          return `"${arr[parseInt(index)]}"`;
        }
        return match;
      })
      
      // Replace _0x function calls that just return array values
      .replace(/(_0x[a-f0-9]+)\("0x([0-9a-f]+)"\)/g, (match, funcName, hexIndex) => {
        const arr = sandbox[funcName];
        if (arr) {
          const idx = parseInt(hexIndex, 16);
          if (arr[idx]) return `"${arr[idx]}"`;
        }
        return match;
      });

    // Format the deobfuscated code
    deobfuscated = formatCode(deobfuscated);

    return deobfuscated || "// Deobfuscation resulted in empty output. The code may use advanced obfuscation.";
  } catch (e: any) {
    return `// Deobfuscation error: ${e.message}\n\n// Original code:\n${code}`;
  }
}

// ─── 2. Deminify Code ────────────────────────────────────────────────────
export function deminify(code: string, language = "js"): string {
  let formatted = code;

  if (language === "js" || language === "javascript") {
    formatted = formatted
      // Semicolons
      .replace(/;/g, ";\n")
      // Open braces
      .replace(/\{/g, "{\n  ")
      // Close braces
      .replace(/\}/g, "\n}")
      // Comma + newline for object properties
      .replace(/,\s*(?=[\w"'])/g, ",\n")
      // Fix double newlines
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      // Indent inside braces
      .replace(/\}\n,/g, "},")
      // Clean up empty blocks
      .replace(/\{\s*\}/g, "{}")
      // Fix multiple semicolons
      .replace(/;+/g, ";");
  } else if (language === "css") {
    formatted = formatted
      .replace(/\{/g, " {\n  ")
      .replace(/\}/g, "\n}\n")
      .replace(/;/g, ";\n  ")
      .replace(/\n\s*\n/g, "\n");
  } else if (language === "html") {
    formatted = formatted
      .replace(/></g, ">\n<")
      .replace(/<\/([^>]+)>/g, "</$1>\n");
  }

  return formatted.trim();
}

// ─── 3. Run JavaScript in Sandbox ────────────────────────────────────────
export function runInSandbox(code: string, data?: any): any {
  const logs: string[] = [];
  const errors: string[] = [];

  const sandbox: any = {
    console: {
      log: (...args: any[]) => { logs.push(args.map(String).join(" ")); },
      error: (...args: any[]) => { errors.push(args.map(String).join(" ")); },
      warn: (...args: any[]) => { logs.push("[WARN] " + args.map(String).join(" ")); },
    },
    setTimeout: () => {},
    setInterval: () => {},
    clearTimeout: () => {},
    fetch: globalThis.fetch,
    JSON: JSON,
    Math: Math,
    Date: Date,
    RegExp: RegExp,
    String: String,
    Number: Number,
    Array: Array,
    Object: Object,
    Boolean: Boolean,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    data: data || {},
    atob: (s: string) => Buffer.from(s, "base64").toString("utf-8"),
    btoa: (s: string) => Buffer.from(s).toString("base64"),
  };

  const startTime = Date.now();

  try {
    vm.createContext(sandbox);
    const result = vm.runInContext(code, sandbox, { timeout: 5000 });
    
    return {
      success: true,
      result: result !== undefined ? result : null,
      console: logs,
      errors,
      executionTime: `${Date.now() - startTime}ms`,
    };
  } catch (e: any) {
    return {
      success: false,
      error: e.message,
      console: logs,
      errors: [...errors, e.message],
      executionTime: `${Date.now() - startTime}ms`,
    };
  }
}

// ─── 4. Fetch Headless (Browser Simulation) ──────────────────────────────
export async function fetchHeadless(url: string, options?: {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  cookies?: string;
  followRedirects?: boolean;
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "no-cache",
      ...(options?.headers || {}),
    };

    if (options?.cookies) {
      headers["Cookie"] = options.cookies;
    }

    const res = await fetch(url, {
      method: options?.method || "GET",
      headers,
      body: options?.body,
      signal: controller.signal,
      redirect: options?.followRedirects !== false ? "follow" : "manual",
    });

    const body = await res.text();
    const setCookies = res.headers.getSetCookie?.() || [];
    const allHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { allHeaders[k] = v; });

    // Parse cookies from response
    const responseCookies: { name: string; value: string; attributes: Record<string, string> }[] = [];
    for (const c of setCookies) {
      const parts = c.split(";").map(p => p.trim());
      const [nameVal, ...attrs] = parts;
      const [name, value] = nameVal.split("=");
      const attributes: Record<string, string> = {};
      for (const attr of attrs) {
        const [k, v] = attr.split("=");
        attributes[k.trim().toLowerCase()] = (v || "").trim();
      }
      responseCookies.push({ name, value, attributes });
    }

    return {
      url: res.url,
      finalUrl: res.url !== url ? res.url : null,
      status: res.status,
      statusText: res.statusText,
      headers: allHeaders,
      cookies: responseCookies,
      cookieString: setCookies.join("; "),
      body: body.substring(0, 500000), // Truncate at 500KB
      bodySize: body.length,
      truncated: body.length > 500000,
    };
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("Request timed out after 30 seconds");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ─── 5. Auto-Decode ──────────────────────────────────────────────────────
export function autoDecode(input: string): {
  detected: string;
  decoded: string;
  details?: any;
} {
  const trimmed = input.trim();

  // Try JWT
  if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(trimmed)) {
    try {
      const parts = trimmed.split(".");
      const header = JSON.parse(Buffer.from(parts[0], "base64").toString());
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
      return {
        detected: "JWT Token",
        decoded: JSON.stringify(payload, null, 2),
        details: { header, payload, signature: parts[2] },
      };
    } catch {}
  }

  // Try Base64
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 4) {
    try {
      const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
      if (decoded.match(/^[\x20-\x7E\s\n\r\t]+$/)) {
        return { detected: "Base64", decoded };
      }
    } catch {}
  }

  // Try URL encoding
  if (trimmed.includes("%") && /%[0-9A-Fa-f]{2}/.test(trimmed)) {
    try {
      const decoded = decodeURIComponent(trimmed);
      if (decoded !== trimmed) {
        return { detected: "URL Encoded", decoded };
      }
    } catch {}
  }

  // Try Hex
  if (/^[0-9A-Fa-f]+$/.test(trimmed) && trimmed.length > 2) {
    try {
      const decoded = Buffer.from(trimmed, "hex").toString("utf-8");
      if (decoded.match(/^[\x20-\x7E\s\n\r\t]+$/)) {
        return { detected: "Hexadecimal", decoded };
      }
    } catch {}
  }

  // Try ROT13
  const rot13Decoded = trimmed.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
  if (rot13Decoded !== trimmed && rot13Decoded.match(/[aeiou]/i)) {
    return { detected: "ROT13", decoded: rot13Decoded };
  }

  // Try JSON
  try {
    const parsed = JSON.parse(trimmed);
    return { detected: "JSON", decoded: JSON.stringify(parsed, null, 2) };
  } catch {}

  return { detected: "Plain Text", decoded: trimmed };
}

// ─── Formatter ────────────────────────────────────────────────────────────
function formatCode(code: string): string {
  return code
    .replace(/;/g, ";\n")
    .replace(/\{/g, "{\n  ")
    .replace(/\}/g, "\n}")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/\}\n,/g, "},")
    .replace(/\{\s*\}/g, "{}")
    .replace(/;+/g, ";")
    .trim();
}
