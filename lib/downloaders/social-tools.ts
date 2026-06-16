// ─── YOUTUBE THUMBNAILS ─────────────────────────────
export function getYouTubeThumbnails(videoId: string) {
  const id = videoId.includes("youtube.com") 
    ? new URL(videoId).searchParams.get("v") || videoId.split("/").pop()?.split("?")[0]
    : videoId.includes("youtu.be") 
      ? videoId.split("/").pop()?.split("?")[0]
      : videoId;
  
  if (!id) return { success: false, error: "Invalid YouTube URL or video ID" };
  
  return {
    success: true,
    videoId: id,
    thumbnails: {
      default: `https://img.youtube.com/vi/${id}/default.jpg`,
      medium: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      high: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      standard: `https://img.youtube.com/vi/${id}/sddefault.jpg`,
      maxres: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      "0": `https://img.youtube.com/vi/${id}/0.jpg`,
      "1": `https://img.youtube.com/vi/${id}/1.jpg`,
      "2": `https://img.youtube.com/vi/${id}/2.jpg`,
      "3": `https://img.youtube.com/vi/${id}/3.jpg`,
    }
  };
}

// ─── LINK PREVIEW (OG TAGS) ─────────────────────────
export async function getLinkPreview(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MeganAPIs/3.6.4; +https://apis.megan.qzz.io)" }
  });
  const html = await res.text();
  
  const getMeta = (prop: string) => {
    const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
    return match?.[1] || null;
  };
  
  return {
    success: true,
    url,
    title: getMeta("og:title") || getMeta("twitter:title") || html.match(/<title>([^<]+)<\/title>/)?.[1] || null,
    description: getMeta("og:description") || getMeta("twitter:description") || getMeta("description"),
    image: getMeta("og:image") || getMeta("twitter:image"),
    siteName: getMeta("og:site_name"),
    type: getMeta("og:type"),
    favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
  };
}

// ─── WHATSAPP ────────────────────────────────────────
export function getWhatsAppLink(phone: string, message?: string) {
  const clean = phone.replace(/[^0-9]/g, "");
  const link = `https://wa.me/${clean}` + (message ? `?text=${encodeURIComponent(message)}` : "");
  return { success: true, phone: clean, link, qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}` };
}

// ─── EMAIL TOOLS ─────────────────────────────────────
export function getGravatar(email: string) {
  const hash = Array.from(new Uint8Array(new TextEncoder().encode(email.trim().toLowerCase())))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  const crypto = require("crypto");
  const md5 = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return {
    success: true,
    email: email.trim().toLowerCase(),
    hash: md5,
    gravatar: `https://www.gravatar.com/avatar/${md5}?s=200&d=identicon`,
    profile: `https://www.gravatar.com/${md5}.json`,
  };
}

const DISPOSABLE_DOMAINS = [
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "throwaway.email", "yopmail.com", "temp-mail.org", "sharklasers.com",
  "trashmail.com", "maildrop.cc", "dispostable.com", "mailnesia.com",
  "spamgourmet.com", "mytrashmail.com", "getnada.com", "fakeinbox.com",
];

export function checkDisposableEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  const isDisposable = DISPOSABLE_DOMAINS.includes(domain || "");
  return { success: true, email, domain, disposable: isDisposable };
}
