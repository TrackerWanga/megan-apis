import { exec } from "child_process";
import { promisify } from "util";
import { getDownloadInfo, extractVideoId } from "../scraper";

const execAsync = promisify(exec);

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

export interface YandexVideoResult {
  id: string;
  pos: number;
  title: string;
  description: string;
  domain: string;
  duration: string;
  durationSeconds: number;
  thumbnail: string;
  url: string;
  downloadUrl: string;
}

export interface YandexVideoSearchResponse {
  success: boolean;
  creator: string;
  query?: string;
  page?: number;
  count?: number;
  results?: YandexVideoResult[];
  error?: string;
}

function toAbsUrl(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("//")) return "https:" + raw;
  return raw;
}

function safeParseJson(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}

async function fetchViaProxy(targetUrl: string): Promise<string> {
  const encodedUrl = encodeURIComponent(targetUrl);
  const proxyUrl = `https://corsproxy.io/?${encodedUrl}`;
  const { stdout } = await execAsync(
    `curl -s "${proxyUrl}" -H "User-Agent: ${MOBILE_UA}" -H "Accept: application/json, text/html" -H "Accept-Language: en-US,en;q=0.9" -H "Accept-Encoding: identity" --max-time 25`,
    { maxBuffer: 10 * 1024 * 1024 }
  );
  return stdout;
}

async function resolveDownloadUrl(videoPageUrl: string): Promise<string> {
  if (!videoPageUrl) return "";

  // For YouTube URLs use the existing multi-provider downloader (no cookies needed)
  if (extractVideoId(videoPageUrl)) {
    try {
      const result = await getDownloadInfo(videoPageUrl, "mp4");
      if (result.success && result.downloadUrl && result.downloadUrl.startsWith("http")) {
        return result.downloadUrl;
      }
    } catch {}
    return "";
  }

  // For other platforms try yt-dlp directly
  try {
    const cmd = `yt-dlp --no-warnings -f "best[height<=720][ext=mp4]/best[height<=720]/best[ext=mp4]/best" --socket-timeout 12 -g "${videoPageUrl}" 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 18000 });
    const lines = stdout.trim().split("\n").filter(Boolean);
    const url = lines[lines.length - 1] || "";
    return url.startsWith("http") ? url : "";
  } catch {
    return "";
  }
}

function parseResponse(raw: string): YandexVideoResult[] {
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON response from Yandex Videos API");
  }

  const results_obj = data?.results;
  if (!results_obj) throw new Error("No results object in Yandex Videos response");

  const serpItems: any[] = results_obj?.search?.serpItems || [];
  const clips: Record<string, any> = results_obj?.clips?.items || {};

  if (serpItems.length === 0) throw new Error("No video results found");

  const results: YandexVideoResult[] = [];

  for (let i = 0; i < serpItems.length; i++) {
    const si = serpItems[i];
    if (si.type !== "videoSnippet") continue;

    const videoId: string = si.props?.videoId;
    if (!videoId) continue;

    const clip = clips[videoId];
    if (!clip) continue;

    const title: string = clip.relatedParams?.text || "";
    if (!title) continue;

    const description: string = clip.description || "";
    const thumbnail = toAbsUrl(clip.preview?.posterSrc || "");

    let url = "";
    let domain = "";
    const relatedStr: string = clip.relatedParams?.related || "";
    if (relatedStr) {
      const relatedObj = safeParseJson(relatedStr);
      if (relatedObj?.url) {
        url = relatedObj.url;
        try {
          domain = new URL(url).hostname.replace(/^www\./, "");
        } catch {}
      }
    }

    results.push({
      id: videoId,
      pos: i,
      title,
      description,
      domain,
      duration: "",
      durationSeconds: 0,
      thumbnail,
      url,
      downloadUrl: "",
    });
  }

  return results;
}

export async function searchYandexVideos(
  query: string,
  page = 0
): Promise<YandexVideoSearchResponse> {
  const creator = "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech";
  try {
    const targetUrl = `https://yandex.com/video/touch/search?text=${encodeURIComponent(query)}&p=${page}&format=json`;
    const raw = await fetchViaProxy(targetUrl);

    if (!raw || raw.trim().length < 100) {
      throw new Error("Empty or too-short response received from proxy");
    }

    const results = parseResponse(raw);

    // Resolve download URLs in parallel for all results
    const downloadUrls = await Promise.all(
      results.map((r) => resolveDownloadUrl(r.url))
    );

    downloadUrls.forEach((dlUrl, i) => {
      results[i].downloadUrl = dlUrl;
    });

    return { success: true, creator, query, page, count: results.length, results };
  } catch (err: any) {
    return {
      success: false,
      creator,
      error: err?.message || "Unknown error while scraping Yandex Videos",
    };
  }
}
