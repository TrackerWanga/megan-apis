const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface ImageResult {
  title: string;
  image: string;
  thumbnail: string;
  source: string;
  pageUrl: string;
  width: number;
  height: number;
}

export interface ImageSearchResponse {
  success: boolean;
  creator: string;
  query?: string;
  count?: number;
  results?: ImageResult[];
  error?: string;
}

async function getVqd(query: string): Promise<string> {
  const res = await fetch(
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
    {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(10000),
    }
  );
  const html = await res.text();
  const m = html.match(/vqd=['"]([^'"]+)['"]/);
  if (!m) throw new Error("Could not retrieve search token from DuckDuckGo");
  return m[1];
}

export async function searchImages(query: string, count = 10): Promise<ImageSearchResponse> {
  try {
    const vqd = await getVqd(query);

    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(vqd)}&f=,,,&p=1`,
      {
        headers: {
          "User-Agent": UA,
          Referer: "https://duckduckgo.com/",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(12000),
      }
    );

    if (!imgRes.ok) {
      throw new Error(`DuckDuckGo image search returned status ${imgRes.status}`);
    }

    const data = await imgRes.json() as { results?: any[] };
    const raw = data.results || [];

    const results: ImageResult[] = raw.slice(0, count).map((item: any) => ({
      title: item.title || "",
      image: item.image || "",
      thumbnail: item.thumbnail || "",
      source: item.source || "",
      pageUrl: item.url || "",
      width: item.width || 0,
      height: item.height || 0,
    }));

    return {
      success: true,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      query,
      count: results.length,
      results,
    };
  } catch (err: any) {
    return {
      success: false,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      error: err.message || "Image search failed",
    };
  }
}
