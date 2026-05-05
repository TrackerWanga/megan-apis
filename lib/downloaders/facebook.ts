import vm from "vm";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface FacebookLink {
  url: string;
  label: string;
  isHD: boolean;
}

interface FacebookResult {
  success: boolean;
  creator?: string;
  title?: string;
  sdUrl?: string;
  hdUrl?: string;
  thumbnail?: string;
  duration?: string;
  links?: FacebookLink[];
  provider?: string;
  error?: string;
}

export async function downloadFacebook(url: string): Promise<FacebookResult> {
  try {
    const result = await tryFdownloader(url);
    if (result.success) return result;

    const result2 = await tryGetmyfb(url);
    if (result2.success) return result2;

    const result3 = await trySnapsave(url);
    if (result3.success) return result3;

    return {
      success: false,
      error: "Could not process this Facebook video URL. Make sure the video is public and the URL is correct.",
    };
  } catch (error: any) {
    return { success: false, error: `Facebook download failed: ${error.message}` };
  }
}

export async function downloadFacebookSnap(url: string): Promise<FacebookResult> {
  return trySnapsave(url);
}

async function tryFdownloader(url: string): Promise<FacebookResult> {
  try {
    const res = await fetch("https://v3.fdownloader.net/api/ajaxSearch", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://fdownloader.net",
        "Referer": "https://fdownloader.net/",
      },
      body: new URLSearchParams({ q: url.trim(), lang: "en", country: "en" }).toString(),
      signal: AbortSignal.timeout(15000),
    });

    const json = await res.json();

    if (json.status !== "ok" || !json.data) {
      return { success: false, error: "fdownloader returned no data" };
    }

    const html: string = json.data;

    const linkMatches: string[] = [];
    const linkRegex = /href=\\?"(https?:\/\/[^\\"\s]+)\\?"/gi;
    let lm;
    while ((lm = linkRegex.exec(html)) !== null) linkMatches.push(lm[1]);

    const downloadLinks = linkMatches.filter(l =>
      l.includes("snapcdn.app/download") || l.includes("fbcdn.net") || l.includes(".mp4")
    );

    if (downloadLinks.length === 0) {
      return { success: false, error: "No download links found" };
    }

    const thumbnailMatch = html.match(/src=\\?"(https?:\/\/[^\\"\s]+\.(?:jpg|png|jpeg)[^\\"\s]*)\\?"/i);
    const durationMatch = html.match(/<p[^>]*>(\d{1,2}:\d{2}(?::\d{2})?)<\/p>/i);
    const titleMatch = html.match(/<h3[^>]*>([^<]+)<\/h3>/i);

    let hdUrl: string | undefined;
    let sdUrl: string | undefined;

    for (const link of downloadLinks) {
      const decoded = link.replace(/\\"/g, '"');
      if (decoded.includes("720p") || decoded.includes("(HD)") || decoded.includes("1080p")) {
        if (!hdUrl) hdUrl = decoded;
      } else {
        if (!sdUrl) sdUrl = decoded;
      }
    }

    if (!hdUrl && !sdUrl) {
      sdUrl = downloadLinks[0].replace(/\\"/g, '"');
      hdUrl = downloadLinks[1]?.replace(/\\"/g, '"');
    }

    return {
      success: true,
      creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech",
      provider: "fdownloader.net",
      title: titleMatch?.[1]?.trim() || "Facebook Video",
      sdUrl: sdUrl || hdUrl,
      hdUrl: hdUrl || sdUrl,
      thumbnail: thumbnailMatch?.[1]?.replace(/&amp;/g, "&") || undefined,
      duration: durationMatch?.[1] || undefined,
    };
  } catch {
    return { success: false, error: "fdownloader.net unavailable" };
  }
}

async function tryGetmyfb(url: string): Promise<FacebookResult> {
  try {
    const res = await fetch("https://getmyfb.com/process", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://getmyfb.com",
        "Referer": "https://getmyfb.com/",
      },
      body: new URLSearchParams({ id: url.trim(), locale: "en" }).toString(),
      signal: AbortSignal.timeout(15000),
    });

    const html = await res.text();

    const allLinks: string[] = [];
    let m;
    const videoRegex = /href="(https?:\/\/[^"]*video[^"]*\.mp4[^"]*)"/gi;
    while ((m = videoRegex.exec(html)) !== null) allLinks.push(m[1]);
    const dlRegex = /href="(https?:\/\/[^"]+)"\s*[^>]*download/gi;
    while ((m = dlRegex.exec(html)) !== null) allLinks.push(m[1]);

    if (allLinks.length === 0) {
      const anyLinks: string[] = [];
      const fbRegex = /href="(https?:\/\/[^"]*(?:fbcdn|facebook|fb)[^"]*)"/gi;
      while ((m = fbRegex.exec(html)) !== null) anyLinks.push(m[1]);
      if (anyLinks.length === 0) {
        return { success: false, error: "No download links found from getmyfb" };
      }
      return {
        success: true,
        creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech",
        provider: "getmyfb.com",
        title: "Facebook Video",
        sdUrl: anyLinks[0],
        hdUrl: anyLinks[1] || undefined,
      };
    }

    return {
      success: true,
      creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech",
      provider: "getmyfb.com",
      title: "Facebook Video",
      sdUrl: allLinks[0],
      hdUrl: allLinks[1] || undefined,
    };
  } catch {
    return { success: false, error: "getmyfb.com unavailable" };
  }
}

async function trySnapsave(fbUrl: string): Promise<FacebookResult> {
  try {
    const formData = new FormData();
    formData.append("url", fbUrl);

    const response = await fetch("https://snapsave.app/action.php?lang=en", {
      method: "POST",
      body: formData,
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        Referer: "https://snapsave.app/",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(20000),
    });

    const rawJs = await response.text();

    if (!rawJs || rawJs.length < 200) {
      return { success: false, error: "Empty/short response from snapsave.app" };
    }

    let capturedHTML = "";
    const domEl = {
      get innerHTML() { return capturedHTML; },
      set innerHTML(v: string) { capturedHTML = v; },
      remove() {},
    };

    const sandbox = vm.createContext({
      window: { location: { hostname: "snapsave.app" } },
      document: { getElementById: () => domEl, querySelector: () => null },
      Math,
      Date,
    });

    try {
      vm.runInContext(rawJs, sandbox, { timeout: 6000 });
    } catch (_) {
      // Expected — snapsave JS references non-critical browser APIs we haven't mocked
    }

    if (!capturedHTML) {
      return { success: false, error: "Could not decode snapsave.app response — innerHTML not captured" };
    }

    const linkRe = /href="(https:\/\/d\.rapidcdn\.app\/v2[^"]+)"/g;
    const links: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(capturedHTML)) !== null) links.push(m[1]);

    if (!links.length) {
      return { success: false, error: "No rapidcdn download links found in snapsave response" };
    }

    const qualRe = /class="video-quality">([^<]+)<\/td>/g;
    const quals: string[] = [];
    let qm: RegExpExecArray | null;
    while ((qm = qualRe.exec(capturedHTML)) !== null) quals.push(qm[1].trim());

    const thumbM = capturedHTML.match(/img src="(https:\/\/d\.rapidcdn\.app\/thumb[^"]+)"/);
    const thumb = thumbM ? thumbM[1] : "";

    const formatted: FacebookLink[] = links.map((u, i) => {
      const q = quals[i] || `Quality ${i + 1}`;
      return {
        url: u,
        label: q,
        isHD: /hd|720|1080/i.test(q),
      };
    });

    const hdLink = formatted.find(l => l.isHD)?.url || links[0];
    const sdLink = formatted.find(l => !l.isHD)?.url || (links.length > 1 ? links[links.length - 1] : links[0]);

    return {
      success: true,
      creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech",
      provider: "snapsave.app",
      title: "Facebook Video",
      hdUrl: hdLink,
      sdUrl: sdLink,
      thumbnail: thumb || undefined,
      links: formatted,
    };
  } catch (err: any) {
    return { success: false, error: `snapsave.app failed: ${err.message}` };
  }
}
