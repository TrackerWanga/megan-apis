const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface TikTokResult {
  success: boolean;
  creator?: string;
  title?: string;
  author?: string;
  videoUrl?: string;
  videoUrlNoWatermark?: string;
  audioUrl?: string;
  thumbnail?: string;
  error?: string;
}

async function getToken(): Promise<{ tt: string; furl: string }> {
  const res = await fetch("https://ssstik.io/", {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Encoding": "identity",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  const html = await res.text();

  const ttMatch = html.match(/s_tt\s*=\s*'([^']+)'/);
  const furlMatch = html.match(/s_furl\s*=\s*'([^']+)'/);

  return {
    tt: ttMatch?.[1] || "",
    furl: furlMatch?.[1] || "abc",
  };
}

export async function downloadTikTok(url: string): Promise<TikTokResult> {
  try {
    const { tt, furl } = await getToken();

    if (!tt) {
      return { success: false, error: "Failed to get session token from TikTok downloader service" };
    }

    const formData = new URLSearchParams();
    formData.append("id", url.trim());
    formData.append("locale", "en");
    formData.append("tt", tt);

    const res = await fetch(`https://ssstik.io/${furl}?url=dl`, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Origin": "https://ssstik.io",
        "Referer": "https://ssstik.io/",
        "HX-Request": "true",
        "HX-Target": "target",
        "HX-Current-URL": "https://ssstik.io/",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Encoding": "identity",
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: formData.toString(),
    });

    const html = await res.text();

    if (!html || html.trim().length < 50) {
      return { success: false, error: "Empty response from TikTok downloader. The service may be temporarily unavailable." };
    }

    if (
      html.includes("panel critical") ||
      html.includes("currently unavailable") ||
      html.includes("Video currently unavailable") ||
      html.includes("changed something") ||
      html.includes("Error code:") ||
      (html.includes("error") && html.includes("invalid"))
    ) {
      const errMatch = html.match(/Error code[^<]*<\/b>\s*([^<]*)/i) ||
                       html.match(/<p>([^<]{10,200})<\/p>/);
      const errMsg = errMatch?.[1]?.trim() || "Video unavailable or TikTok API error";
      return { success: false, error: errMsg };
    }

    const links: string[] = [];
    let linkMatch;
    const linkRegex = /href="(https?:\/\/[^"]+)"/g;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      links.push(linkMatch[1]);
    }

    const titleMatch = html.match(/<p[^>]*class="[^"]*maintext[^"]*"[^>]*>([^<]+)/i) ||
                       html.match(/<strong[^>]*class="[^"]*maintext[^"]*"[^>]*>([^<]+)/i) ||
                       html.match(/<h2[^>]*>([^<]{3,150})<\/h2>/i);
    const authorMatch = html.match(/@([a-zA-Z0-9_.]+)/);

    const tikcdnLinks = links.filter(l => l.includes("tikcdn.io"));
    const videoUrl = tikcdnLinks.find(l => !l.includes("/m/") && !l.includes("/a/") && !l.includes("/p/")) || tikcdnLinks[0];
    const videoNoWm = tikcdnLinks.find(l => l.includes("/m/")) || videoUrl;
    const thumbnailUrl = tikcdnLinks.find(l => l.includes("/p/"));
    const audioUrl = tikcdnLinks.find(l => l.includes("/mp3/") || l.includes("/audio/") || l.includes("/music/")) ||
                     links.find(l => l.includes("mp3") || l.includes("music") || l.includes("audio"));

    if (!videoUrl) {
      return { success: false, error: "Could not extract download links. The video may be private or unavailable." };
    }

    return {
      success: true,
      creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
      title: titleMatch?.[1]?.trim() || "TikTok Video",
      author: authorMatch?.[1] || undefined,
      videoUrl,
      videoUrlNoWatermark: videoNoWm || videoUrl,
      audioUrl: audioUrl || undefined,
      thumbnail: thumbnailUrl || undefined,
    };
  } catch (error: any) {
    return { success: false, error: `TikTok download failed: ${error.message}` };
  }
}
