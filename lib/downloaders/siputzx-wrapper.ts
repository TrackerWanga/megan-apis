import axios from "axios";

const SIPUTZX_BASE = "https://api.siputzx.my.id";
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
];

function randomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }

async function siputzxGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${SIPUTZX_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await axios.get(url.toString(), {
    headers: { "User-Agent": randomUA(), "Accept": "application/json", "Accept-Language": "en-US,en;q=0.9", "Referer": "https://siputzx.pages.dev/", "Origin": "https://siputzx.pages.dev" },
    timeout: 30000,
  });
  return res.data;
}

function formatVideo(video: any) {
  return {
    videoId: video.videoId,
    title: video.title,
    description: video.description?.substring(0, 200) || null,
    url: video.url,
    thumbnail: video.thumbnail || video.image,
    duration: video.timestamp,
    durationSeconds: video.seconds,
    views: video.views,
    uploaded: video.ago,
    author: video.author?.name,
    authorUrl: video.author?.url,
  };
}

// ─── Bible AI ──────────────────────────────────────────────────────────────
export async function bibleAI(question: string, translation = "ESV") {
  const data = await siputzxGet("/api/ai/bibleai", { question, translation });
  if (!data?.status || !data?.data) throw new Error("Bible AI returned unexpected response");
  const r = data.data;
  return {
    question: r.question, translation: r.translation, translationCode: r.translationCode,
    answer: r.results?.answer,
    sources: (r.results?.sources || []).map((s: any) => ({ text: s.text, reference: s.splitReference || null, type: s.type, title: s.title || null, author: s.author || null, url: s.url || null })),
    sourceCount: r.results?.sources?.length || 0,
  };
}

// ─── SoundCloud Download ───────────────────────────────────────────────────
export async function soundcloudDownload(inputUrl: string) {
  const data = await siputzxGet("/api/d/soundcloud", { url: inputUrl });
  if (!data?.status || !data?.data) throw new Error("SoundCloud download failed");
  const d = data.data;
  return {
    title: d.title, downloadUrl: d.url, thumbnail: d.thumbnail,
    duration: d.duration ? `${Math.floor(d.duration / 60000)}:${String(Math.floor((d.duration % 60000) / 1000)).padStart(2, "0")}` : null,
    durationMs: d.duration, artist: d.user, description: d.description || null, service: "SoundCloud via Siputzx",
  };
}

// ─── SoundCloud Search ─────────────────────────────────────────────────────
export async function soundcloudSearch(query: string, limit = 10) {
  const data = await siputzxGet("/api/s/soundcloud", { query: encodeURIComponent(query) });
  if (!data?.status || !data?.data) return { query, results: [], totalResults: 0 };
  const results = (Array.isArray(data.data) ? data.data : []).slice(0, limit).map((track: any) => ({
    title: track.permalink?.replace(/-/g, " ") || "Unknown", genre: track.genre || "Unknown",
    duration: track.duration ? `${Math.floor(track.duration / 60000)}:${String(Math.floor((track.duration % 60000) / 1000)).padStart(2, "0")}` : null,
    artwork: track.artwork_url, permalink: track.permalink_url, plays: track.playback_count || 0, comments: track.comment_count || 0, createdAt: track.created_at,
  }));
  return { query, results, totalResults: results.length, service: "SoundCloud via Siputzx" };
}

// ─── YouTube Search (Rich) ─────────────────────────────────────────────────
export async function youtubeSearch(query: string) {
  const data = await siputzxGet("/api/s/youtube", { query: encodeURIComponent(query) });
  if (!data?.status || !data?.data) return { query, results: [], totalResults: 0 };
  const results = (Array.isArray(data.data) ? data.data : []).filter((item: any) => item.type === "video").map(formatVideo);
  return { query, results, totalResults: results.length, service: "YouTube via Siputzx" };
}

// ─── YouTube Trending ──────────────────────────────────────────────────────
export async function youtubeTrending() {
  const queries = ["trending music 2026", "viral videos", "trending now", "popular uploads", "breaking news"];
  const allResults: any[] = [];
  for (const q of queries.slice(0, 2)) {
    try {
      const data = await siputzxGet("/api/s/youtube", { query: encodeURIComponent(q) });
      if (data?.status && Array.isArray(data.data)) {
        allResults.push(...data.data.filter((item: any) => item.type === "video").map(formatVideo));
      }
    } catch {}
  }
  const unique = allResults.filter((v, i, self) => self.findIndex(t => t.videoId === v.videoId) === i).slice(0, 20);
  return { results: unique, totalResults: unique.length, service: "YouTube via Siputzx" };
}

// ─── YouTube Recommendations ───────────────────────────────────────────────
export async function youtubeRecommend(videoId: string) {
  const data = await siputzxGet("/api/s/youtube", { query: encodeURIComponent(videoId) });
  if (!data?.status || !data?.data) throw new Error("Failed to get recommendations");
  const results = (Array.isArray(data.data) ? data.data : []).filter((item: any) => item.type === "video" && item.videoId !== videoId).slice(0, 10).map(formatVideo);
  return { videoId, recommendations: results, totalResults: results.length, service: "YouTube via Siputzx" };
}

// ─── Music Search (Music Only) ─────────────────────────────────────────────
export async function musicSearch(query: string) {
  // Add "song" or "audio" to query to bias towards music results
  const searchQuery = `${query} song`;
  const data = await siputzxGet("/api/s/youtube", { query: encodeURIComponent(searchQuery) });
  if (!data?.status || !data?.data) return { query, results: [], totalResults: 0 };
  
  const results = (Array.isArray(data.data) ? data.data : [])
    .filter((item: any) => item.type === "video")
    // Filter out non-music content
    .filter((v: any) => {
      const title = (v.title || "").toLowerCase();
      const desc = (v.description || "").toLowerCase();
      // Must contain music-related terms
      return title.includes("song") || title.includes("official") || title.includes("audio") ||
             title.includes("music") || title.includes("lyric") || title.includes("video") ||
             desc.includes("music") || desc.includes("song") || desc.includes("album") ||
             desc.includes("official") || desc.includes("audio");
    })
    .slice(0, 20)
    .map(formatVideo);
  
  return { query, results, totalResults: results.length, service: "YouTube Music via Siputzx" };
}

// ─── Music Trending (Trending Songs) ───────────────────────────────────────
export async function musicTrending() {
  const queries = ["trending songs 2026", "new music this week", "top hits 2026", "viral songs", "billboard hot 100"];
  const allResults: any[] = [];
  
  for (const q of queries.slice(0, 3)) {
    try {
      const data = await siputzxGet("/api/s/youtube", { query: encodeURIComponent(q) });
      if (data?.status && Array.isArray(data.data)) {
        const musicVids = data.data
          .filter((item: any) => item.type === "video")
          .filter((v: any) => {
            const t = (v.title || "").toLowerCase();
            return t.includes("official") || t.includes("audio") || t.includes("music") ||
                   t.includes("video") || t.includes("song") || t.includes("lyric");
          })
          .map(formatVideo);
        allResults.push(...musicVids);
      }
    } catch {}
  }
  
  const unique = allResults.filter((v, i, self) => self.findIndex(t => t.videoId === v.videoId) === i).slice(0, 25);
  return { results: unique, totalResults: unique.length, service: "YouTube Music via Siputzx" };
}

// ─── Artist Search ─────────────────────────────────────────────────────────
export async function artistSearch(artist: string) {
  const queries = [
    `${artist} official music`,
    `${artist} songs`,
    `${artist} latest`,
  ];
  const allResults: any[] = [];
  
  for (const q of queries) {
    try {
      const data = await siputzxGet("/api/s/youtube", { query: encodeURIComponent(q) });
      if (data?.status && Array.isArray(data.data)) {
        allResults.push(...data.data.filter((item: any) => item.type === "video").map(formatVideo));
      }
    } catch {}
  }
  
  const unique = allResults.filter((v, i, self) => self.findIndex(t => t.videoId === v.videoId) === i).slice(0, 15);
  return { artist, songs: unique, totalSongs: unique.length, service: "YouTube via Siputzx" };
}
