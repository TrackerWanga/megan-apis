import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

export interface YandexImageSize {
  url: string;
  thumb: string;
  width: number;
  height: number;
}

export interface YandexImageResult {
  id: string;
  pos: number;
  title: string;
  domain: string;
  thumbnail: string;
  originalUrl: string;
  detailUrl: string;
  medium: YandexImageSize | null;
  large: YandexImageSize | null;
}

export interface YandexImageSearchResponse {
  success: boolean;
  creator: string;
  query?: string;
  page?: number;
  count?: number;
  results?: YandexImageResult[];
  error?: string;
}

function toAbsUrl(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("//")) return "https:" + raw;
  return raw;
}

function extractOriginalUrl(yandexUrl: string): string {
  try {
    const match = yandexUrl.match(/img_url=([^&]+)/);
    if (match) return decodeURIComponent(match[1]);
  } catch {}
  return "";
}

async function fetchViaProxy(targetUrl: string): Promise<string> {
  const encodedUrl = encodeURIComponent(targetUrl);
  const proxyUrl = `https://corsproxy.io/?${encodedUrl}`;
  const { stdout } = await execAsync(
    `curl -s "${proxyUrl}" -H "User-Agent: ${MOBILE_UA}" -H "Accept: text/html,application/xhtml+xml" -H "Accept-Language: en-US,en;q=0.9" -H "Accept-Encoding: identity" --max-time 25`,
    { maxBuffer: 10 * 1024 * 1024 }
  );
  return stdout;
}

function htmlEntityDecode(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function parseHtml(html: string, query: string, page: number): YandexImageSearchResponse {
  const creator = "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech";

  if (html.includes("Are you not a robot") || html.includes("checkcaptcha")) {
    throw new Error("Blocked by Yandex bot detection (CAPTCHA)");
  }

  const allStateMatches = [...html.matchAll(/data-state="([^"]+)"/g)];
  if (allStateMatches.length === 0) {
    throw new Error("No page state found in Yandex response");
  }

  let serpListItems: { keys: string[]; entities: Record<string, any> } | null = null;

  for (const match of allStateMatches) {
    const decoded = htmlEntityDecode(match[1]);
    try {
      const obj = JSON.parse(decoded);
      const items = obj?.initialState?.serpList?.items;
      if (items?.keys && items?.entities) {
        serpListItems = items;
        break;
      }
    } catch {}
  }

  if (!serpListItems) {
    throw new Error("Could not find image data in Yandex page state");
  }

  const { keys, entities } = serpListItems;

  const VIDEO_DOMAINS = new Set([
    "youtube.com", "youtu.be", "vimeo.com", "dailymotion.com",
    "twitch.tv", "tiktok.com", "rutube.ru", "ok.ru", "vk.com",
  ]);

  const results: YandexImageResult[] = keys
    .map((key) => {
      const item = entities[key];
      if (!item) return null;

      // Skip video items — Yandex mixes videos into image search results
      if (
        item.video ||
        item.duration ||
        item.durationIso ||
        item.type === "video" ||
        item.contentType === "video"
      ) return null;

      const snippet = item.snippet || {};
      const domain: string = snippet.domain || item.domain || "";

      // Also skip known video hosting domains
      const rootDomain = domain.replace(/^www\./, "");
      if (VIDEO_DOMAINS.has(rootDomain)) return null;

      const sizes = item.sizes || {};
      const med = sizes.medium || null;
      const lrg = sizes.large || null;

      const originalUrl = extractOriginalUrl(item.url || item.detail_url || "");

      return {
        id: item.id || key,
        pos: typeof item.pos === "number" ? item.pos : 0,
        title: item.alt || snippet.title || "",
        domain,
        thumbnail: toAbsUrl(item.image || ""),
        originalUrl,
        detailUrl: item.detail_url ? `https://yandex.com${item.detail_url}` : "",
        medium: med
          ? {
              url: med.link || "",
              thumb: toAbsUrl(med.thumb || ""),
              width: med.width || 0,
              height: med.height || 0,
            }
          : null,
        large: lrg
          ? {
              url: lrg.link || "",
              thumb: toAbsUrl(lrg.thumb || ""),
              width: lrg.width || 0,
              height: lrg.height || 0,
            }
          : null,
      };
    })
    .filter(Boolean) as YandexImageResult[];

  return { success: true, creator, query, page, count: results.length, results };
}

export async function searchYandexImages(
  query: string,
  page = 0
): Promise<YandexImageSearchResponse> {
  const creator = "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech";
  try {
    const targetUrl = `https://yandex.com/images/touch/search?lr=21312&text=${encodeURIComponent(query)}&p=${page}`;
    const html = await fetchViaProxy(targetUrl);

    if (!html || html.trim().length < 5000) {
      throw new Error("Empty or too-short response received from proxy");
    }

    return parseHtml(html, query, page);
  } catch (err: any) {
    return {
      success: false,
      creator,
      error: err?.message || "Unknown error while scraping Yandex Images",
    };
  }
}
