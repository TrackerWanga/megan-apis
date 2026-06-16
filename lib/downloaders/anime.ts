const SOURCES = [
  {
    name: "waifu.pics",
    url: (type: string) => `https://api.waifu.pics/sfw/${type}`,
    extract: (data: any) => data.url,
    types: ["waifu","neko","shinobu","megumin","bully","cuddle","cry","hug","awoo","kiss","lick","pat","smug","bonk","yeet","blush","smile","wave","highfive","handhold","nom","bite","slap","kill","happy","wink","poke","dance","cringe"]
  },
  {
    name: "nekos.best",
    url: (type: string) => `https://nekos.best/api/v2/${type}`,
    extract: (data: any) => data.results?.[0]?.url,
    types: ["highfive","happy","sleep","handhold","laugh","bite","poke","tickle","kiss","wave","thumbsup","stare","cuddle","smile","baka","blush","think","pout","facepalm","wink","shoot","yawn","nod","cry","punch","dance","nervous","hug"]
  },
];

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAnimeImage(type: string): Promise<{ url: string; type: string; source: string }> {
  const normalizedType = type.toLowerCase().trim();
  for (const source of SOURCES) {
    if (!source.types.includes(normalizedType)) continue;
    try {
      const data = await fetchWithTimeout(source.url(normalizedType));
      if (data) {
        const url = source.extract(data);
        if (url) return { url, type: normalizedType, source: source.name };
      }
    } catch {}
  }
  throw new Error(`Could not fetch anime image for "${normalizedType}"`);
}

export const waifuPicsTypes = SOURCES[0].types;
export const nekosBestTypes = SOURCES[1].types;
