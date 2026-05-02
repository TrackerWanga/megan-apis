import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const SHAZAM_SEARCH_URL = "https://www.shazam.com/services/amapi/v1/catalog/US/search";
const SHAZAM_TRACK_URL = "https://www.shazam.com/discovery/v5/en/US/web/-/track";

interface ShazamTrack {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  genre?: string;
  year?: string;
  shazamUrl?: string;
  appleMusic?: string;
  spotify?: string;
  trackId?: string;
  previewUrl?: string;
}

interface ShazamSearchResult {
  success: boolean;
  creator: string;
  query?: string;
  tracks?: ShazamTrack[];
  error?: string;
}

interface ShazamRecognizeResult {
  success: boolean;
  creator: string;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  genre?: string;
  year?: string;
  shazamUrl?: string;
  appleMusic?: string;
  spotify?: string;
  trackId?: string;
  error?: string;
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

function parseShazamTrack(item: any): ShazamTrack | null {
  try {
    const attrs = item.attributes || item;
    const track: ShazamTrack = {
      title: attrs.title || attrs.name || "Unknown",
      artist: attrs.artistName || attrs.subtitle || attrs.artist || "Unknown",
      album: attrs.albumName || undefined,
      genre: attrs.genreNames?.[0] || undefined,
      year: attrs.releaseDate?.substring(0, 4) || undefined,
      trackId: item.id || undefined,
    };

    if (attrs.artwork?.url) {
      track.albumArt = attrs.artwork.url
        .replace("{w}", "400")
        .replace("{h}", "400");
    } else if (attrs.images?.coverarthq || attrs.images?.coverart) {
      track.albumArt = attrs.images.coverarthq || attrs.images.coverart;
    }

    if (attrs.url) {
      track.shazamUrl = attrs.url;
    } else if (attrs.share?.href) {
      track.shazamUrl = attrs.share.href;
    }

    if (attrs.previews?.[0]?.url) {
      track.previewUrl = attrs.previews[0].url;
    }

    const providers = attrs.hub?.providers || [];
    for (const p of providers) {
      if (p.type === "SPOTIFY" && p.actions?.[0]?.uri) {
        track.spotify = p.actions[0].uri;
      }
    }

    if (attrs.hub?.options) {
      for (const opt of attrs.hub.options) {
        if (opt.providername === "SPOTIFY" && opt.actions?.[0]?.uri) {
          track.spotify = opt.actions[0].uri;
        }
        if (opt.providername === "APPLE_MUSIC" && opt.actions?.[0]?.uri) {
          track.appleMusic = opt.actions[0].uri;
        }
      }
    }

    return track;
  } catch {
    return null;
  }
}

async function searchViaShazamApi(query: string): Promise<ShazamTrack[]> {
  try {
    const url = `${SHAZAM_SEARCH_URL}?term=${encodeURIComponent(query)}&limit=10&types=songs`;
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();

    const songs = data?.results?.songs?.data || [];
    const tracks: ShazamTrack[] = [];
    for (const song of songs) {
      const t = parseShazamTrack(song);
      if (t) tracks.push(t);
    }
    return tracks;
  } catch {
    return [];
  }
}

async function searchViaShazamWeb(query: string): Promise<ShazamTrack[]> {
  try {
    const url = `https://www.shazam.com/services/search/v4/en/US/web/search?term=${encodeURIComponent(query)}&numResults=10&offset=0&types=songs,artists`;
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();

    const tracks: ShazamTrack[] = [];

    const hits = data?.tracks?.hits || data?.songs?.hits || [];
    for (const hit of hits) {
      const item = hit.track || hit;
      const t = parseShazamTrack(item);
      if (t) tracks.push(t);
    }

    if (tracks.length === 0 && data?.results?.songs?.data) {
      for (const song of data.results.songs.data) {
        const t = parseShazamTrack(song);
        if (t) tracks.push(t);
      }
    }

    return tracks;
  } catch {
    return [];
  }
}

async function searchViaShazamV1(query: string): Promise<ShazamTrack[]> {
  try {
    const url = `https://www.shazam.com/services/search/v3/en/US/web/search?query=${encodeURIComponent(query)}&numResults=10&offset=0&types=songs`;
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();

    const tracks: ShazamTrack[] = [];
    const hits = data?.tracks?.hits || [];
    for (const hit of hits) {
      const item = hit.track || hit;
      const t: ShazamTrack = {
        title: item.heading?.title || item.title || "Unknown",
        artist: item.heading?.subtitle || item.subtitle || "Unknown",
        albumArt: item.images?.default || item.images?.coverart || undefined,
        shazamUrl: item.url || item.share?.href || undefined,
        trackId: item.key || item.id || undefined,
      };

      if (item.stores?.apple?.previewurl) {
        t.previewUrl = item.stores.apple.previewurl;
      }
      if (item.hub?.providers) {
        for (const p of item.hub.providers) {
          if (p.type === "SPOTIFY") t.spotify = p.actions?.[0]?.uri;
        }
      }
      tracks.push(t);
    }
    return tracks;
  } catch {
    return [];
  }
}

export async function searchShazam(query: string): Promise<ShazamSearchResult> {
  if (!query || query.trim().length === 0) {
    return { success: false, creator: "Megan APIs by Tracker Wanga | Falcon Tech", error: "Search query is required." };
  }

  console.log(`[shazam] Searching: ${query}`);

  let tracks = await searchViaShazamApi(query);

  if (tracks.length === 0) {
    tracks = await searchViaShazamWeb(query);
  }

  if (tracks.length === 0) {
    tracks = await searchViaShazamV1(query);
  }

  if (tracks.length === 0) {
    return {
      success: false,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      query,
      error: "No results found. Try a different search term.",
    };
  }

  return {
    success: true,
    creator: "Megan APIs by Tracker Wanga | Falcon Tech",
    query,
    tracks,
  };
}

function convertToPCM(audioBuffer: Buffer): Buffer {
  const id = Date.now() + "_" + Math.random().toString(36).substring(7);
  const inputPath = join(tmpdir(), `shazam_input_${id}`);
  const outputPath = join(tmpdir(), `shazam_output_${id}.raw`);

  try {
    writeFileSync(inputPath, audioBuffer);

    execSync(
      `ffmpeg -y -i "${inputPath}" -f s16le -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}" 2>/dev/null`,
      { timeout: 15000 }
    );

    const pcmBuffer = readFileSync(outputPath);
    return pcmBuffer;
  } catch (err: any) {
    console.error(`[shazam] ffmpeg conversion failed:`, err.message);
    return audioBuffer;
  } finally {
    try { if (existsSync(inputPath)) unlinkSync(inputPath); } catch {}
    try { if (existsSync(outputPath)) unlinkSync(outputPath); } catch {}
  }
}

function isPCM(buffer: Buffer): boolean {
  if (buffer.length < 12) return true;
  const header = buffer.subarray(0, 12).toString("ascii");
  if (header.startsWith("RIFF") || header.startsWith("ID3") || header.startsWith("\xff\xfb") || header.startsWith("ftyp") || header.includes("ftyp")) return false;
  const magic = buffer[0];
  if (magic === 0xff || magic === 0x49 || magic === 0x52 || magic === 0x4f) return false;
  return true;
}

export async function recognizeShazam(audioBuffer: Buffer): Promise<ShazamRecognizeResult> {
  try {
    const { Shazam, s16LEToSamplesArray } = await import("shazam-api");

    const shazam = new Shazam();

    const samples = s16LEToSamplesArray(new Uint8Array(audioBuffer));

    console.log(`[shazam] Recognizing audio (${audioBuffer.length} bytes, ${samples.length} samples)`);

    const result = await shazam.recognizeSong(samples);

    if (!result) {
      return {
        success: false,
        creator: "Megan APIs by Tracker Wanga | Falcon Tech",
        error: "Could not identify the song. Try a longer or clearer audio sample.",
      };
    }

    return {
      success: true,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      title: result.title,
      artist: result.artist,
      album: result.album,
      year: result.year,
    };
  } catch (err: any) {
    console.error(`[shazam] Recognition error:`, err.message);
    return {
      success: false,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      error: `Recognition failed: ${err.message || "Unknown error"}. Ensure audio is raw PCM (s16LE, mono, 16kHz).`,
    };
  }
}

async function recognizeViaACRCloud(audioBuffer: Buffer): Promise<ShazamRecognizeResult | null> {
  try {
    const acrcloud = (await import("acrcloud")).default;
    const acr = new acrcloud({
      host: "identify-us-west-2.acrcloud.com",
      access_key: "4ee38e62e85515a47158aeb3d26fb741",
      access_secret: "KZd3cUQoOYSmZQn1n5ACW5XSbqGlKLhg6G8S8EvJ",
    });

    let buffer = audioBuffer;
    const MAX_SIZE = 1 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      buffer = buffer.slice(0, MAX_SIZE);
    }

    const { status, metadata } = await acr.identify(buffer);

    if (status.code !== 0 || !metadata?.music?.[0]) {
      console.log(`[shazam] ACRCloud failed: ${status.msg}`);
      return null;
    }

    const music = metadata.music[0];
    const response: ShazamRecognizeResult = {
      success: true,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      title: music.title || "Unknown",
      artist: music.artists?.map((a: any) => a.name).join(", ") || "Unknown",
      album: music.album?.name || undefined,
      genre: music.genres?.map((g: any) => g.name).join(", ") || undefined,
      year: music.release_date?.substring(0, 4) || undefined,
    };

    if (music.external_metadata?.spotify?.track?.id) {
      response.spotify = `https://open.spotify.com/track/${music.external_metadata.spotify.track.id}`;
    }

    if (music.external_metadata?.deezer?.track?.id) {
      response.trackId = music.external_metadata.deezer.track.id.toString();
    }

    return response;
  } catch (err: any) {
    console.error(`[shazam] ACRCloud error:`, err.message);
    return null;
  }
}

export async function recognizeShazamFull(audioBuffer: Buffer): Promise<ShazamRecognizeResult> {
  const acrResult = await recognizeViaACRCloud(audioBuffer);
  if (acrResult) return acrResult;

  try {
    const { Shazam, s16LEToSamplesArray } = await import("shazam-api");

    if (!isPCM(audioBuffer)) {
      console.log(`[shazam] Detected non-PCM audio, converting with ffmpeg...`);
      audioBuffer = convertToPCM(audioBuffer);
    }

    const shazam = new Shazam();
    const samples = s16LEToSamplesArray(new Uint8Array(audioBuffer));

    console.log(`[shazam] Full recognizing audio (${audioBuffer.length} bytes)`);

    const result = await shazam.fullRecognizeSong(samples);

    if (!result || !result.track) {
      return {
        success: false,
        creator: "Megan APIs by Tracker Wanga | Falcon Tech",
        error: "Could not identify the song. Try a longer or clearer audio sample.",
      };
    }

    const track = result.track;
    const response: ShazamRecognizeResult = {
      success: true,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      title: track.title || track.heading?.title,
      artist: track.subtitle || track.heading?.subtitle,
      trackId: track.key,
      shazamUrl: track.url || track.share?.href,
      genre: track.genres?.primary,
    };

    if (track.images?.coverarthq || track.images?.coverart) {
      response.albumArt = track.images.coverarthq || track.images.coverart;
    }

    if (track.sections) {
      for (const section of track.sections) {
        if (section.type === "SONG" && section.metadata) {
          for (const meta of section.metadata) {
            if (meta.title === "Album") response.album = meta.text;
            if (meta.title === "Released") response.year = meta.text;
          }
        }
      }
    }

    if (track.hub?.providers) {
      for (const p of track.hub.providers) {
        if (p.type === "SPOTIFY") response.spotify = p.actions?.[0]?.uri;
      }
    }
    if (track.hub?.options) {
      for (const opt of track.hub.options) {
        if (opt.providername === "APPLE_MUSIC") response.appleMusic = opt.actions?.[0]?.uri;
      }
    }

    return response;
  } catch (err: any) {
    console.error(`[shazam] Full recognition error:`, err.message);
    return {
      success: false,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      error: `Recognition failed: ${err.message || "Unknown error"}. Try a shorter audio clip (10-20 seconds).`,
    };
  }
}

async function getTrackViaShazamDiscovery(trackId: string): Promise<ShazamRecognizeResult | null> {
  try {
    const url = `${SHAZAM_TRACK_URL}/${trackId}`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const track = await res.json();
    if (!track.title && !track.heading?.title) return null;

    return {
      success: true,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      title: track.title || track.heading?.title,
      artist: track.subtitle || track.heading?.subtitle,
      albumArt: track.images?.coverarthq || track.images?.coverart,
      genre: track.genres?.primary,
      shazamUrl: track.url || track.share?.href,
      trackId: track.key || trackId,
    };
  } catch {
    return null;
  }
}

async function getTrackViaAppleMusic(trackId: string): Promise<ShazamRecognizeResult | null> {
  try {
    const url = `${SHAZAM_SEARCH_URL}?term=${encodeURIComponent(trackId)}&limit=1&types=songs`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const songs = data?.results?.songs?.data || [];
    if (songs.length === 0) return null;

    const song = songs[0];
    const attrs = song.attributes || {};
    let albumArt: string | undefined;
    if (attrs.artwork?.url) {
      albumArt = attrs.artwork.url.replace("{w}", "400").replace("{h}", "400");
    }

    return {
      success: true,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      title: attrs.title || attrs.name,
      artist: attrs.artistName,
      album: attrs.albumName,
      albumArt,
      genre: attrs.genreNames?.[0],
      year: attrs.releaseDate?.substring(0, 4),
      shazamUrl: attrs.url,
      trackId: song.id || trackId,
    };
  } catch {
    return null;
  }
}

async function getTrackViaItunes(trackId: string): Promise<ShazamRecognizeResult | null> {
  try {
    const url = `https://itunes.apple.com/lookup?id=${trackId}&entity=song`;
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const track = data?.results?.[0];
    if (!track || !track.trackName) return null;

    const albumArt = track.artworkUrl100?.replace("100x100", "400x400") || track.artworkUrl60?.replace("60x60", "400x400");

    return {
      success: true,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      albumArt,
      genre: track.primaryGenreName,
      year: track.releaseDate?.substring(0, 4),
      shazamUrl: track.trackViewUrl,
      trackId: String(track.trackId || trackId),
    };
  } catch {
    return null;
  }
}

export async function getTrackDetails(trackId: string): Promise<ShazamRecognizeResult> {
  console.log(`[shazam] Getting track details for: ${trackId}`);

  let result = await getTrackViaItunes(trackId);
  if (result) return result;

  result = await getTrackViaShazamDiscovery(trackId);
  if (result) return result;

  result = await getTrackViaAppleMusic(trackId);
  if (result) return result;

  return { success: false, creator: "Megan APIs by Tracker Wanga | Falcon Tech", error: `Track not found for ID: ${trackId}. Try a different track ID.` };
}
