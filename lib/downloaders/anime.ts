const WAIFU_PICS_BASE = "https://api.waifu.pics/sfw";
const NEKOS_BEST_BASE = "https://nekos.best/api/v2";

const waifuPicsTypes = [
  "waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug",
  "awoo", "kiss", "lick", "pat", "smug", "bonk", "yeet", "blush", "smile",
  "wave", "highfive", "handhold", "nom", "bite", "slap", "kill", "happy",
  "wink", "poke", "dance", "cringe",
];

const nekosBestTypes = [
  "highfive", "happy", "sleep", "handhold", "laugh", "bite",
  "poke", "tickle", "kiss", "wave", "thumbsup", "stare",
  "cuddle", "smile", "baka", "blush", "think", "pout",
  "facepalm", "wink", "shoot", "yawn", "nod", "cry",
  "punch", "dance", "nervous", "hug",
];

export async function fetchAnimeImage(type: string): Promise<{ url: string; type: string; source: string }> {
  const normalizedType = type.toLowerCase().trim();

  if (waifuPicsTypes.includes(normalizedType)) {
    const res = await fetch(`${WAIFU_PICS_BASE}/${normalizedType}`);
    if (!res.ok) throw new Error(`waifu.pics returned ${res.status}`);
    const data = await res.json();
    return { url: data.url, type: normalizedType, source: "waifu.pics" };
  }

  if (nekosBestTypes.includes(normalizedType)) {
    const res = await fetch(`${NEKOS_BEST_BASE}/${normalizedType}`);
    if (!res.ok) throw new Error(`nekos.best returned ${res.status}`);
    const data = await res.json();
    const result = data.results?.[0];
    return {
      url: result?.url || "",
      type: normalizedType,
      source: "nekos.best",
    };
  }

  throw new Error(`Unknown anime type: ${normalizedType}. Available: ${waifuPicsTypes.join(", ")}`);
}

export { waifuPicsTypes, nekosBestTypes };
