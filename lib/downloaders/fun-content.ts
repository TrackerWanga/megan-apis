// ─── MEMES (Multiple sources) ───────────────────────
export async function getMeme() {
  const sources = [
    "https://meme-api.com/gimme",
    "https://api.imgflip.com/get_memes",
  ];
  for (const url of sources) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.url) return { success: true, title: data.title, url: data.url, author: data.author, subreddit: data.subreddit };
      if (data.data?.memes) {
        const m = data.data.memes[Math.floor(Math.random() * data.data.memes.length)];
        return { success: true, title: m.name, url: m.url, width: m.width, height: m.height };
      }
    } catch {}
  }
  return { success: false, error: "All meme sources unavailable" };
}

export async function getMemes(count = 5) {
  const memes = [];
  for (let i = 0; i < count; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("https://meme-api.com/gimme", { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        memes.push({ title: data.title, url: data.url, subreddit: data.subreddit });
      }
    } catch {}
  }
  return { success: true, count: memes.length, memes };
}

// ─── QUOTES (Multiple sources) ──────────────────────
export async function getQuote() {
  const sources = [
    async () => {
      const res = await fetch("https://api.quotable.io/random");
      const data = await res.json();
      return { quote: data.content, author: data.author, tags: data.tags };
    },
    async () => {
      const res = await fetch("https://zenquotes.io/api/random");
      const data = await res.json();
      return { quote: data[0]?.q, author: data[0]?.a };
    },
    async () => {
      // Fallback: use your own fun API
      const res = await fetch("https://apis.megan.qzz.io/api/fun/quotes?apikey=megan_admin_master");
      const data = await res.json();
      if (data.result) return { quote: data.result, author: "Unknown" };
      throw new Error("No quote");
    },
  ];
  for (const fn of sources) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const result = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000))]);
      clearTimeout(timer);
      if (result) return { success: true, ...result };
    } catch {}
  }
  return { success: false, error: "All quote sources unavailable" };
}

// ─── FACTS ──────────────────────────────────────────
export async function getFact() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random", { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      return { success: true, fact: data.text, source: data.source };
    }
  } catch {}
  // Fallback
  return { success: true, fact: "The average cloud weighs about 1.1 million pounds.", source: "fallback" };
}

export async function getCatFact() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://catfact.ninja/fact", { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      return { success: true, fact: data.fact, length: data.length };
    }
  } catch {}
  return { success: true, fact: "Cats sleep for 70% of their lives.", length: 30 };
}

// ─── RIDDLES ────────────────────────────────────────
export async function getRiddle() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://riddles-api.vercel.app/random", { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      return { success: true, riddle: data.riddle, answer: data.answer };
    }
  } catch {}
  // Fallback riddles
  const riddles = [
    { riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "An echo" },
    { riddle: "The more you take, the more you leave behind. What am I?", answer: "Footsteps" },
    { riddle: "I'm tall when I'm young, and I'm short when I'm old. What am I?", answer: "A candle" },
  ];
  const r = riddles[Math.floor(Math.random() * riddles.length)];
  return { success: true, ...r };
}

// ─── TRIVIA ─────────────────────────────────────────
export async function getTrivia() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://opentdb.com/api.php?amount=1", { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const q = data.results[0];
      return {
        success: true, category: q.category, difficulty: q.difficulty,
        question: q.question, correctAnswer: q.correct_answer,
        incorrectAnswers: q.incorrect_answers, type: q.type,
      };
    }
  } catch {}
  return { success: true, question: "What is the capital of Kenya?", correctAnswer: "Nairobi", incorrectAnswers: ["Mombasa", "Kisumu", "Nakuru"], category: "Geography", difficulty: "easy" };
}
