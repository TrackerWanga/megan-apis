const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const CREATOR = "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech";

interface TwitterMedia {
  type: "video" | "image" | "gif";
  url: string;
  quality?: string;
  thumbnail?: string;
}

interface TwitterResult {
  success: boolean;
  creator?: string;
  title?: string;
  author?: string;
  media?: TwitterMedia[];
  error?: string;
  provider?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function trySaveTwitter(url: string): Promise<TwitterResult> {
  try {
    const res = await fetchWithTimeout("https://twitsave.com/info?url=" + encodeURIComponent(url.trim()), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const html = await res.text();

    const titleMatch = html.match(/<p[^>]*class="[^"]*m-2[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const authorMatch = html.match(/@([a-zA-Z0-9_]+)/);

    const videoLinks: string[] = [];
    const qualityRegex = /href="(https?:\/\/[^"]*(?:video\.twimg|twitsave)[^"]*)"/gi;
    let m;
    while ((m = qualityRegex.exec(html)) !== null) {
      videoLinks.push(m[1].replace(/&amp;/g, "&"));
    }

    const downloadBtnRegex = /download-btn[^>]*href="(https?:\/\/[^"]+)"/gi;
    while ((m = downloadBtnRegex.exec(html)) !== null) {
      videoLinks.push(m[1].replace(/&amp;/g, "&"));
    }

    if (videoLinks.length === 0) {
      return { success: false, error: "TwitSave returned no download links" };
    }

    const media: TwitterMedia[] = videoLinks.map((link, i) => ({
      type: "video" as const,
      url: link,
      quality: i === 0 ? "best" : `option ${i + 1}`,
    }));

    return {
      success: true,
      creator: CREATOR,
      provider: "twitsave",
      title: titleMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || "Twitter/X Media",
      author: authorMatch?.[1] || undefined,
      media,
    };
  } catch {
    return { success: false, error: "TwitSave unavailable" };
  }
}

async function trySSSTwitter(url: string): Promise<TwitterResult> {
  try {
    const pageRes = await fetchWithTimeout("https://ssstwitter.com/", {
      headers: { "User-Agent": USER_AGENT },
    });
    const pageHtml = await pageRes.text();

    const tokenMatch = pageHtml.match(/name="token"\s*value="([^"]+)"/);

    const formData = new URLSearchParams();
    formData.append("id", url.trim());
    formData.append("locale", "en");
    if (tokenMatch) formData.append("token", tokenMatch[1]);

    const res = await fetchWithTimeout("https://ssstwitter.com/r", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://ssstwitter.com",
        Referer: "https://ssstwitter.com/",
      },
      body: formData.toString(),
    });

    const html = await res.text();

    const links: string[] = [];
    const linkRegex = /href="(https?:\/\/[^"]*(?:twimg|ssstwitter|video)[^"]*)"/gi;
    let m;
    while ((m = linkRegex.exec(html)) !== null) {
      links.push(m[1].replace(/&amp;/g, "&"));
    }

    if (links.length === 0) {
      return { success: false, error: "SSSTwitter returned no links" };
    }

    const media: TwitterMedia[] = links.map((link, i) => ({
      type: "video" as const,
      url: link,
      quality: i === 0 ? "HD" : "SD",
    }));

    return {
      success: true,
      creator: CREATOR,
      provider: "ssstwitter",
      title: "Twitter/X Video",
      media,
    };
  } catch {
    return { success: false, error: "SSSTwitter unavailable" };
  }
}

async function tryTwdl(url: string): Promise<TwitterResult> {
  try {
    const res = await fetchWithTimeout("https://twittervideodownloader.com/download", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://twittervideodownloader.com",
        Referer: "https://twittervideodownloader.com/",
      },
      body: new URLSearchParams({ tweet: url.trim() }).toString(),
    });

    const html = await res.text();

    const links: { url: string; quality: string }[] = [];
    const qualityRegex = /<a[^>]*href="(https?:\/\/video\.twimg\.com[^"]*)"[^>]*>[\s\S]*?(\d+x\d+)/gi;
    let m;
    while ((m = qualityRegex.exec(html)) !== null) {
      links.push({ url: m[1].replace(/&amp;/g, "&"), quality: m[2] });
    }

    const fallbackRegex = /href="(https?:\/\/video\.twimg\.com[^"]*)"/gi;
    while ((m = fallbackRegex.exec(html)) !== null) {
      if (!links.some(l => l.url === m[1])) {
        links.push({ url: m[1].replace(/&amp;/g, "&"), quality: "unknown" });
      }
    }

    if (links.length === 0) {
      return { success: false, error: "TWDL returned no links" };
    }

    return {
      success: true,
      creator: CREATOR,
      provider: "twdl",
      title: "Twitter/X Video",
      media: links.map(l => ({ type: "video" as const, url: l.url, quality: l.quality })),
    };
  } catch {
    return { success: false, error: "TWDL unavailable" };
  }
}

export async function downloadTwitter(url: string): Promise<TwitterResult> {
  if (!url || !url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/\d+/i)) {
    return { success: false, error: "Invalid Twitter/X URL. Provide a tweet URL like https://x.com/user/status/123456" };
  }

  const providers: Array<{ name: string; fn: () => Promise<TwitterResult> }> = [
    { name: "twitsave", fn: () => trySaveTwitter(url) },
    { name: "ssstwitter", fn: () => trySSSTwitter(url) },
    { name: "twdl", fn: () => tryTwdl(url) },
  ];

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`[twitter] Trying provider: ${provider.name}`);
      const result = await provider.fn();
      if (result.success) {
        console.log(`[twitter] Provider ${provider.name} succeeded`);
        return result;
      }
      errors.push(`${provider.name}: ${result.error}`);
    } catch (err: any) {
      errors.push(`${provider.name}: ${err.message}`);
    }
  }

  return {
    success: false,
    creator: CREATOR,
    error: "Could not download this Twitter/X video. The tweet may be private, deleted, or contain no video.",
  } as any;
}
