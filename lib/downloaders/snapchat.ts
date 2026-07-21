const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface SnapchatResult {
  success: boolean;
  creator?: string;
  username?: string;
  displayName?: string;
  mediaUrls?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  type?: "video" | "story" | "spotlight" | "profile";
  error?: string;
}

async function getSnapmateToken(): Promise<{ fieldName: string; fieldValue: string; cookies: string }> {
  const res = await fetch("https://snapmate.io/", {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
    },
  });

  const html = await res.text();
  const cookies = res.headers.getSetCookie?.()?.join("; ") ||
                  (res.headers.get("set-cookie") || "");

  const hiddenFieldMatch = html.match(/input name="([^"]+)" type="hidden" value="([^"]+)"/);
  if (!hiddenFieldMatch) {
    throw new Error("Could not extract security token from Snapchat downloader");
  }

  return {
    fieldName: hiddenFieldMatch[1],
    fieldValue: hiddenFieldMatch[2],
    cookies,
  };
}

function parseSnapmateHtml(html: string): Partial<SnapchatResult> {
  const result: Partial<SnapchatResult> = {};

  const videoMatches: string[] = [];
  const hrefRegex = /href="(https?:\/\/[^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = hrefRegex.exec(html)) !== null) {
    const link = m[1];
    if (
      link.includes("sc-cdn.net") ||
      link.includes("snapchat.com/m") ||
      link.includes(".mp4") ||
      link.includes(".mov") ||
      link.includes("video") ||
      link.includes("download")
    ) {
      videoMatches.push(link);
    }
  }

  const srcRegex = /src="(https?:\/\/[^"]+)"/g;
  const srcLinks: string[] = [];
  while ((m = srcRegex.exec(html)) !== null) {
    srcLinks.push(m[1]);
  }

  const usernameMatch = html.match(/<p><b>@([^<]+)<\/b><\/p>/) ||
                        html.match(/@([a-zA-Z0-9_.]+)/);
  const displayNameMatch = html.match(/<h3>([^<]+)<\/h3>/);
  const avatarMatch = srcLinks.find(s => s.includes("sc-cdn.net") && s.includes("avatar")) ||
                      srcLinks.find(s => s.includes("sc-cdn.net"));
  const videoUrl = videoMatches.find(l => l.includes(".mp4") || l.includes(".mov")) ||
                   videoMatches.find(l => l.includes("cdn")) ||
                   videoMatches[0];

  if (usernameMatch) result.username = usernameMatch[1];
  if (displayNameMatch) result.displayName = displayNameMatch[1].trim();
  if (avatarMatch) result.thumbnailUrl = avatarMatch;
  if (videoUrl) result.videoUrl = videoUrl;
  if (videoMatches.length > 0) result.mediaUrls = videoMatches;

  if (html.includes("sc-main") && displayNameMatch) {
    result.type = "profile";
  } else if (videoUrl) {
    result.type = html.includes("spotlight") ? "spotlight" : "story";
  }

  return result;
}

export async function downloadSnapchat(url: string): Promise<SnapchatResult> {
  try {
    const { fieldName, fieldValue, cookies } = await getSnapmateToken();

    const formData = new FormData();
    formData.append("url", url.trim());
    formData.append(fieldName, fieldValue);

    const fetchHeaders: Record<string, string> = {
      "User-Agent": USER_AGENT,
      "Origin": "https://snapmate.io",
      "Referer": "https://snapmate.io/",
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
      "X-Requested-With": "XMLHttpRequest",
    };
    if (cookies) fetchHeaders["Cookie"] = cookies;

    const res = await fetch("https://snapmate.io/fetch", {
      method: "POST",
      headers: fetchHeaders,
      body: formData,
    });

    const json = await res.json() as {
      success?: boolean;
      error?: boolean;
      html?: string;
      error_code?: string;
      message?: string;
    };

    if (!json.success || json.error) {
      const errCode = json.error_code || "";
      let errMsg = json.message || "Snapchat download failed";

      if (errCode === "error_url_support") {
        errMsg = "Only Snapchat story, spotlight, or profile URLs are supported. Please use a valid Snapchat URL.";
      } else if (errCode === "error_invalid") {
        errMsg = "This Snap is unavailable or private. Try using the 'Copy Link' button directly on Snapchat.";
      } else if (errCode === "error_token") {
        errMsg = "Session expired. Please try again.";
      }

      return { success: false, error: errMsg };
    }

    if (!json.html) {
      return { success: false, error: "No content returned from Snapchat downloader" };
    }

    const parsed = parseSnapmateHtml(json.html);

    return {
      success: true,
      creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
      ...parsed,
    };
  } catch (error: any) {
    return { success: false, error: `Snapchat download failed: ${error.message}` };
  }
}
