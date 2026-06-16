import axios from 'axios';

const cryptoFallback: Record<string, any> = {};

export async function getCryptoPrice(coin: string) {
  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,kes&include_24hr_change=true`, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }, timeout: 10000,
    });
    const data = res.data[coin];
    if (!data) throw new Error(`Coin "${coin}" not found`);
    const result = { coin, price_usd: data.usd, price_kes: data.kes, change_24h_percent: data.usd_24h_change?.toFixed(2) || null };
    cryptoFallback[coin] = result;
    return result;
  } catch (e: any) {
    if (cryptoFallback[coin]) return cryptoFallback[coin];
    try {
      const res = await axios.get(`https://api.coincap.io/v2/assets/${coin}`, { timeout: 8000 });
      const d = res.data.data;
      return { coin, price_usd: parseFloat(d.priceUsd).toFixed(2), price_kes: (parseFloat(d.priceUsd) * 130).toFixed(2), change_24h_percent: parseFloat(d.changePercent24Hr).toFixed(2) };
    } catch {
      throw new Error(`Crypto fetch failed: ${e.message}. Try again in a moment.`);
    }
  }
}

export async function getGlobalNews() {
  try {
    const res = await axios.get('https://newsapi.org/v2/top-headlines?category=general&language=en&pageSize=5', {
      headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000,
    });
    return res.data.articles || [];
  } catch {
    return { error: 'Failed to fetch global news', articles: [] };
  }
}

export async function getKenyaNews() {
  try {
    const res = await axios.get('https://newsapi.org/v2/top-headlines?country=ke&pageSize=5', {
      headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000,
    });
    return res.data.articles || [];
  } catch {
    return { error: 'Failed to fetch Kenya news', articles: [] };
  }
}

export async function getAllCryptos() {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false', {
      headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000,
    });
    return res.data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      price_usd: coin.current_price,
      market_cap: coin.market_cap,
      change_24h: coin.price_change_percentage_24h
    }));
  } catch {
    return { error: 'Failed to fetch crypto list', data: [] };
  }
}

export async function getForexRates() {
  try {
    const res = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', { timeout: 10000 });
    return {
      base: 'USD',
      rates: res.data.rates,
      timestamp: res.data.time_last_updated
    };
  } catch {
    return { error: 'Failed to fetch forex rates', rates: {} };
  }
}

export async function convertForex(from: string, to: string, amount: number) {
  try {
    const rates = await getForexRates();
    if (rates.error) throw new Error('Failed to get rates');
    const rate = rates.rates[to.toUpperCase()] / rates.rates[from.toUpperCase()];
    return { from, to, amount, converted: amount * rate, rate };
  } catch {
    return { error: 'Failed to convert currency', result: 0 };
  }
}

export async function getWeather(city: string = 'Nairobi') {
  try {
    const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=demo`, { timeout: 10000 });
    return {
      city: res.data.name,
      temp: res.data.main.temp,
      feels_like: res.data.main.feels_like,
      humidity: res.data.main.humidity,
      description: res.data.weather[0].description,
      wind_speed: res.data.wind.speed
    };
  } catch {
    return { error: 'Failed to fetch weather', temp: 0, city };
  }
}
