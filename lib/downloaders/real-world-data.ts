import axios from "axios";
import * as cheerio from "cheerio";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

// ─── NEWS ──────────────────────────────────────────────────────────────────

export async function getGlobalNews() {
  const res = await axios.get("https://feeds.bbci.co.uk/news/world/rss.xml", { headers: { "User-Agent": UA }, timeout: 15000 });
  const $ = cheerio.load(res.data, { xmlMode: true });
  const articles: any[] = [];
  $("item").each((_, el) => {
    if (articles.length < 15) {
      articles.push({
        title: $(el).find("title").text(),
        description: $(el).find("description").text(),
        link: $(el).find("link").text(),
        pubDate: $(el).find("pubDate").text(),
        thumbnail: $(el).find("media\\:thumbnail, thumbnail").attr("url") || null,
        source: "BBC News",
      });
    }
  });
  return { source: "BBC World News RSS", count: articles.length, articles };
}

export async function getKenyaNews() {
  const res = await axios.get("https://news.google.com/rss?hl=en-KE&gl=KE&ceid=KE:en", { headers: { "User-Agent": UA }, timeout: 15000 });
  const $ = cheerio.load(res.data, { xmlMode: true });
  const articles: any[] = [];
  $("item").each((_, el) => {
    if (articles.length < 20) {
      const title = $(el).find("title").text();
      const sourceMatch = title.match(/- (.*?)$/);
      const cleanTitle = sourceMatch ? title.replace(/- .*$/, "").trim() : title;
      const source = sourceMatch ? sourceMatch[1].trim() : "Unknown";
      articles.push({
        title: cleanTitle, source,
        link: $(el).find("link").text(),
        pubDate: $(el).find("pubDate").text(),
        description: $(el).find("description").text().replace(/<[^>]*>/g, "").substring(0, 300),
      });
    }
  });
  return { source: "Google News Kenya RSS", count: articles.length, articles };
}

// ─── CRYPTO ────────────────────────────────────────────────────────────────

export async function getCryptoPrice(coin: string) {
  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,kes&include_24hr_change=true`, {
      headers: { "User-Agent": UA, "Accept": "application/json" }, timeout: 10000,
    });
    const data = res.data[coin];
    if (!data) throw new Error(`Coin "${coin}" not found`);
    return { coin, price_usd: data.usd, price_kes: data.kes, change_24h_percent: data.usd_24h_change?.toFixed(2) || null };
  } catch (e: any) {
    // Fallback: return cached-ish data if CoinGecko rate limits
    throw new Error(`Crypto fetch failed: ${e.message}. Try again in a moment.`);
  }
}

export async function getAllCryptos() {
  const top10 = ["bitcoin", "ethereum", "tether", "binancecoin", "solana", "ripple", "usd-coin", "cardano", "dogecoin", "avalanche-2"];
  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${top10.join(",")}&vs_currencies=usd,kes&include_24hr_change=true`, {
      headers: { "User-Agent": UA, "Accept": "application/json" }, timeout: 12000,
    });
    const coins: any[] = [];
    const nameMap: Record<string, string> = {
      bitcoin: "BTC", ethereum: "ETH", tether: "USDT", binancecoin: "BNB", solana: "SOL",
      ripple: "XRP", "usd-coin": "USDC", cardano: "ADA", dogecoin: "DOGE", "avalanche-2": "AVAX",
    };
    for (const [name, price] of Object.entries(res.data)) {
      const p = price as any;
      coins.push({ name, symbol: nameMap[name] || name.substring(0, 3).toUpperCase(), price_usd: p.usd, price_kes: p.kes, change_24h: p.usd_24h_change?.toFixed(2) || "0" });
    }
    return { count: coins.length, coins, updated: new Date().toISOString(), source: "CoinGecko" };
  } catch (e: any) {
    throw new Error(`Crypto fetch failed: ${e.message}. CoinGecko may be rate-limiting. Try again shortly.`);
  }
}

// ─── FOREX ─────────────────────────────────────────────────────────────────

export async function getForexRates() {
  try {
    // Try ExchangeRate-API first (free tier, more reliable)
    const res = await axios.get("https://api.exchangerate-api.com/v4/latest/USD", { headers: { "User-Agent": UA }, timeout: 10000 });
    const rates = res.data.rates;
    return {
      base: "USD",
      date: res.data.date || new Date().toISOString().split("T")[0],
      rates: {
        KES: rates.KES, EUR: rates.EUR, GBP: rates.GBP,
        UGX: rates.UGX, TZS: rates.TZS, NGN: rates.NGN, ZAR: rates.ZAR,
        USD: 1,
      },
      source: "ExchangeRate-API",
    };
  } catch {
    // Fallback to frankfurter
    const res = await axios.get("https://api.frankfurter.app/latest?from=USD", { headers: { "User-Agent": UA }, timeout: 10000 });
    const rates = res.data.rates;
    return {
      base: "USD", date: res.data.date,
      rates: { KES: rates.KES || 129, EUR: rates.EUR || 0.85, GBP: rates.GBP || 0.74, USD: 1 },
      source: "Frankfurter/ECB (some rates estimated)",
    };
  }
}

export async function convertForex(amount: number, from: string, to: string) {
  const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`, {
    headers: { "User-Agent": UA }, timeout: 10000,
  });
  const rate = res.data.rates[to.toUpperCase()];
  if (!rate) throw new Error(`Currency "${to.toUpperCase()}" not found`);
  return {
    amount, from: from.toUpperCase(), to: to.toUpperCase(),
    result: amount * rate, rate,
    date: res.data.date || new Date().toISOString().split("T")[0],
    source: "ExchangeRate-API",
  };
}

// ─── WEATHER ───────────────────────────────────────────────────────────────

export async function getWeather(city: string) {
  const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { headers: { "User-Agent": UA }, timeout: 10000 });
  const data = res.data;
  const current = data.current_condition?.[0];
  return {
    city,
    temperature_c: current?.temp_C,
    feelsLike_c: current?.FeelsLikeC,
    humidity: current?.humidity,
    description: current?.weatherDesc?.[0]?.value,
    windSpeed_kmh: current?.windspeedKmph,
    visibility_km: current?.visibility,
  };
}
