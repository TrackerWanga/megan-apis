import { join } from "path";
import { spawn } from "child_process";

function fetchTokenViaHelper(): Promise<string | null> {
  return new Promise((resolve) => {
    const helperPath = join(process.cwd(), "lib", "spotify-token-helper", "get-token.cjs");
    const child = spawn("node", [helperPath], { timeout: 20000 });
    let out = "";
    child.stdout.on("data", (d: Buffer) => { out += d.toString(); });
    child.on("close", () => {
      try {
        const parsed = JSON.parse(out);
        resolve(parsed.token || null);
      } catch {
        resolve(null);
      }
    });
    child.on("error", () => resolve(null));
  });
}

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";
const APP_VERSION = "1.2.84.359.g17db506e";
const CLIENT_ID = "d8a5ed958d274c2e8ee717e6a4b0971d";
const GRAPHQL_URL = "https://api-partner.spotify.com/pathfinder/v2/query";
const WD_UA = "WolfAPIs/1.0";

export const SEARCH_HASH = "3c9d3f60dac5dea3876b6db3f534192b1c1d90032c4233c1bbaba526db41eb31";
export const PLAYLIST_HASH = "19ff1327c29e99c208c86d7a350d0d0aee8a093d912850a334011a5fe1b0bea6";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let cachedClientToken: string | null = null;
let clientTokenExpiresAt = 0;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

async function fetchAccessToken(): Promise<string | null> {
  try {
    const token = await fetchTokenViaHelper();
    if (token) {
      tokenExpiresAt = Date.now() + 30 * 60 * 1000;
      return token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  cachedToken = await fetchAccessToken();
  return cachedToken;
}

export async function getClientToken(): Promise<string | null> {
  if (cachedClientToken && Date.now() < clientTokenExpiresAt) return cachedClientToken;
  try {
    const res = await withTimeout(
      fetch("https://clienttoken.spotify.com/v1/clienttoken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": UA,
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_data: {
            client_version: APP_VERSION,
            client_id: CLIENT_ID,
            js_sdk_data: {
              device_brand: "unknown",
              device_model: "unknown",
              os: "linux",
              os_version: "unknown",
              device_id: Math.random().toString(36).slice(2),
              device_type: "computer",
            },
          },
        }),
      }),
      10000
    );
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const token: string | null =
      data.granted_token?.token || data.client_token || null;
    const ttl: number = data.granted_token?.expires_after_seconds || 3600;
    if (token) {
      cachedClientToken = token;
      clientTokenExpiresAt = Date.now() + ttl * 1000;
    }
    return token;
  } catch {
    return null;
  }
}

export async function spotifyGraphQL(
  operationName: string,
  sha256Hash: string,
  variables: Record<string, unknown>
): Promise<any> {
  const accessToken = await getToken();
  if (!accessToken) throw new Error("Could not obtain Spotify access token");

  const clientToken = await getClientToken();
  const headers: Record<string, string> = {
    accept: "application/json",
    "accept-language": "en-GB",
    "app-platform": "WebPlayer",
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json;charset=UTF-8",
    "spotify-app-version": APP_VERSION,
    "User-Agent": UA,
    Referer: "https://open.spotify.com/",
    Origin: "https://open.spotify.com",
  };
  if (clientToken) headers["client-token"] = clientToken;

  const res = await withTimeout(
    fetch(GRAPHQL_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        variables,
        operationName,
        extensions: { persistedQuery: { version: 1, sha256Hash } },
      }),
    }),
    15000
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `GraphQL ${operationName} failed: ${res.status} — ${body.slice(0, 120)}`
    );
  }
  return res.json();
}

export async function fetchEmbedEntity(
  type: string,
  id: string
): Promise<any> {
  const res = await withTimeout(
    fetch(`https://open.spotify.com/embed/${type}/${id}`, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    }),
    12000
  );
  if (!res.ok) throw new Error(`Embed fetch failed: ${res.status}`);
  const html = await res.text();
  const m = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("No __NEXT_DATA__ in embed page");
  const json = JSON.parse(m[1]);
  const entity = json?.props?.pageProps?.state?.data?.entity;
  if (!entity) throw new Error(`No entity found for ${type}/${id}`);
  return entity;
}

export async function fetchOEmbed(type: string, id: string): Promise<any> {
  const url = `https://open.spotify.com/oembed?url=https://open.spotify.com/${type}/${id}`;
  const res = await withTimeout(
    fetch(url, { headers: { "User-Agent": UA } }),
    8000
  );
  if (!res.ok) throw new Error(`oEmbed failed: ${res.status}`);
  return res.json();
}

export async function mbLookupName(
  spotifyType: string,
  spotifyId: string,
  mbRelType: string
): Promise<any> {
  const spotifyUrl = encodeURIComponent(
    `https://open.spotify.com/${spotifyType}/${spotifyId}`
  );
  const url = `https://musicbrainz.org/ws/2/url?resource=${spotifyUrl}&inc=${mbRelType}-rels&fmt=json`;
  const res = await withTimeout(
    fetch(url, {
      headers: { "User-Agent": WD_UA, Accept: "application/json" },
    }),
    8000
  );
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  for (const rel of data?.relations || []) {
    const entity = rel[mbRelType] || rel["release"];
    if (entity) return entity;
  }
  return null;
}

export async function wdLookupName(
  wdProperty: string,
  spotifyId: string
): Promise<string | null> {
  const sparql = `SELECT ?item ?label WHERE { ?item wdt:${wdProperty} "${spotifyId}". ?item rdfs:label ?label. FILTER(LANG(?label) = "en") } LIMIT 1`;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
  const res = await withTimeout(
    fetch(url, {
      headers: {
        "User-Agent": WD_UA,
        Accept: "application/sparql-results+json",
      },
    }),
    8000
  );
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  return data?.results?.bindings?.[0]?.label?.value || null;
}

export async function searchAndMatchByUri(
  searchTerm: string,
  spotifyUri: string,
  resultType: "artist" | "album"
): Promise<{ type: string; data: any } | null> {
  const data = await spotifyGraphQL("searchDesktop", SEARCH_HASH, {
    searchTerm,
    offset: 0,
    limit: 10,
    numberOfTopResults: 5,
    includeAudiobooks: false,
    includeArtistHasConcertsField: false,
    includePreReleases: true,
    includeLocalConcertsField: false,
  });

  const sv2 = data?.data?.searchV2;
  if (!sv2) return null;

  if (resultType === "artist") {
    const items: any[] = sv2?.artists?.items || [];
    for (const item of items) {
      if (item?.data?.uri === spotifyUri) return { type: "artist", data: item.data };
    }
    return items[0]?.data ? { type: "artist", data: items[0].data } : null;
  }

  if (resultType === "album") {
    const items: any[] = sv2?.albumsV2?.items || [];
    for (const item of items) {
      if (item?.data?.uri === spotifyUri) return { type: "album", data: item.data };
    }
    return items[0]?.data ? { type: "album", data: items[0].data } : null;
  }

  return null;
}

export function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function bestImage(sources: any[] | undefined): string {
  if (!sources || !sources.length) return "";
  return [...sources].sort(
    (a, b) => (b.height || b.width || 0) - (a.height || a.width || 0)
  )[0]?.url || "";
}

export function idFromUri(uri: string | undefined): string {
  return uri ? uri.split(":").pop() || "" : "";
}

const searchCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE = 500;

export function cacheGet(key: string): any | null {
  const e = searchCache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { searchCache.delete(key); return null; }
  return e.data;
}

export function cacheSet(key: string, data: any): void {
  if (searchCache.size >= MAX_CACHE) searchCache.delete(searchCache.keys().next().value!);
  searchCache.set(key, { data, ts: Date.now() });
}
