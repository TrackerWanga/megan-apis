const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const SPOTDOWN_API_KEY = process.env.SPOTDOWN_API_KEY || "fd7a643c9eedd6459334804d1e8014999e130b93d1d6101a4e0592861db56a16";
const SPOTDOWN_BASE = "https://spotdown.org";

interface SpotifyTrack {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration?: string;
  spotifyUrl?: string;
  previewUrl?: string;
}

interface SpotifySearchResult {
  success: boolean;
  creator: string;
  query?: string;
  tracks?: SpotifyTrack[];
  error?: string;
}

interface SpotifyDownloadResult {
  success: boolean;
  creator: string;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  downloadUrl?: string;
  format?: string;
  source?: string;
  spotifyUrl?: string;
  error?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isSpotifyUrl(input: string): boolean {
  return /spotify\.com\/(track|album|playlist|artist)\//.test(input) || /spotify:(track|album|playlist|artist):/.test(input);
}

async function spotdownRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const res = await fetchWithTimeout(`${SPOTDOWN_BASE}${endpoint}`, {
    ...options,
    headers: {
      "User-Agent": USER_AGENT,
      "X-API-Key": SPOTDOWN_API_KEY,
      "Referer": `${SPOTDOWN_BASE}/`,
      "Accept": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  if (res.status === 429) {
    throw new Error("Rate limited by Spotdown. Please try again later.");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotdown returned ${res.status}: ${text.substring(0, 200)}`);
  }

  return res.json();
}

async function searchViaSpotdown(query: string): Promise<SpotifyTrack[]> {
  try {
    const data = await spotdownRequest(`/api/song-details?url=${encodeURIComponent(query)}`);

    if (!data.songs || !Array.isArray(data.songs) || data.songs.length === 0) {
      return [];
    }

    return data.songs.map((song: any) => ({
      title: song.title || "Unknown",
      artist: song.artist || "Unknown",
      album: song.album || undefined,
      albumArt: song.thumbnail || undefined,
      duration: song.duration || undefined,
      spotifyUrl: song.url || undefined,
      previewUrl: song.previewUrl || undefined,
    }));
  } catch (err: any) {
    console.log(`[spotify] Spotdown search failed: ${err.message}`);
    return [];
  }
}

async function searchViaItunes(query: string): Promise<SpotifyTrack[]> {
  try {
    const res = await fetchWithTimeout(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`,
      { headers: { "User-Agent": USER_AGENT } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results?.length) return [];

    return data.results.map((item: any) => ({
      title: item.trackName || "Unknown",
      artist: item.artistName || "Unknown",
      album: item.collectionName || undefined,
      albumArt: item.artworkUrl100?.replace("100x100", "400x400") || undefined,
      duration: item.trackTimeMillis ? `${Math.floor(item.trackTimeMillis / 60000)}:${String(Math.floor((item.trackTimeMillis % 60000) / 1000)).padStart(2, "0")}` : undefined,
      spotifyUrl: undefined,
      previewUrl: item.previewUrl || undefined,
    }));
  } catch {
    return [];
  }
}

export async function searchSpotify(query: string): Promise<SpotifySearchResult> {
  if (!query || query.trim().length === 0) {
    return { success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: "Search query is required." };
  }

  console.log(`[spotify] Searching: ${query}`);

  let tracks = await searchViaSpotdown(query);

  if (tracks.length === 0) {
    console.log(`[spotify] Spotdown search failed, trying iTunes fallback`);
    tracks = await searchViaItunes(query);
  }

  if (tracks.length === 0) {
    return {
      success: false,
      creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
      query,
      error: "No results found. Try a different search term.",
    };
  }

  return {
    success: true,
    creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
    query,
    tracks,
  };
}

export async function downloadSpotify(
  input: string,
  baseUrl: string
): Promise<SpotifyDownloadResult> {
  if (!input || input.trim().length === 0) {
    return { success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: "Provide a Spotify URL or song name." };
  }

  input = input.trim();

  try {
    let song: any = null;
    let spotifyUrl: string | undefined;

    try {
      const songData = await spotdownRequest(`/api/song-details?url=${encodeURIComponent(input)}`);
      if (songData.songs && songData.songs.length > 0) {
        song = songData.songs[0];
        spotifyUrl = song.url;
      }
    } catch (e: any) {
      console.log(`[spotify] Spotdown metadata failed: ${e.message}`);
    }

    if (!song) {
      const itunesResults = await searchViaItunes(input);
      if (itunesResults.length > 0) {
        const t = itunesResults[0];
        song = { title: t.title, artist: t.artist, album: t.album, thumbnail: t.albumArt, previewUrl: t.previewUrl };
        spotifyUrl = t.spotifyUrl;
      }
    }

    if (!song) {
      return { success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech", error: `No results found for "${input}".` };
    }

    let downloadUrl: string | undefined;

    if (spotifyUrl) {
      try {
        const dlRes = await fetchWithTimeout(`${SPOTDOWN_BASE}/api/direct-download?url=${encodeURIComponent(spotifyUrl)}`, {
          headers: { "User-Agent": USER_AGENT, "X-API-Key": SPOTDOWN_API_KEY, "Referer": `${SPOTDOWN_BASE}/` },
        }, 15000);
        if (dlRes.ok) {
          downloadUrl = dlRes.url;
        }
      } catch {}
    }

    if (!downloadUrl) {
      try {
        const savidRes = await fetchWithTimeout(`https://api.savidfy.com/api/download?url=${encodeURIComponent(spotifyUrl || input)}`, {
          headers: { "User-Agent": USER_AGENT },
        }, 15000);
        if (savidRes.ok) {
          const savidData = await savidRes.json() as any;
          if (savidData.url || savidData.downloadUrl || savidData.link) {
            downloadUrl = savidData.url || savidData.downloadUrl || savidData.link;
          }
        }
      } catch {}
    }

    if (!downloadUrl && song.previewUrl) {
      downloadUrl = song.previewUrl;
    }

    return {
      success: true,
      creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
      title: song.title || "Unknown",
      artist: song.artist || "Unknown",
      album: song.album || undefined,
      albumArt: song.thumbnail || undefined,
      downloadUrl: downloadUrl || undefined,
      format: "mp3",
      source: downloadUrl ? (downloadUrl.includes("spotdown") ? "spotdown" : "direct") : "metadata-only",
      spotifyUrl: spotifyUrl || undefined,
    };
  } catch (err: any) {
    console.log(`[spotify] Download failed: ${err.message}`);

    try {
      const searchResult = await searchViaItunes(input);
      if (searchResult.length > 0) {
        const track = searchResult[0];
        return {
          success: true,
          creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: track.albumArt,
          downloadUrl: track.previewUrl || undefined,
          format: "mp3",
          source: "itunes",
        };
      }
    } catch {}

    return {
      success: false,
      creator: "Megan APIs v3.6.4 | Tracker Wanga | Megan Tech",
      error: `Could not find track for "${input}". Try a Spotify URL or different search term.`,
    };
  }
}
