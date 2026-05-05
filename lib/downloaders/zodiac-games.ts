import zodiacData from "../../data/zodiac.json" with { type: "json" };

function randomId() { return Math.random().toString(36).substring(2, 10); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ─── ZODIAC ────────────────────────────────────────────────────────────────

const HOROSCOPE_TEMPLATES = [
  "Today the stars align in your favor. {sign}, expect unexpected opportunities in {area}. Your lucky number is {number}.",
  "A powerful {planet} influence brings change to your {area} life. Stay open to new connections, {sign}.",
  "Your natural {trait} will guide you through today's challenges. Trust your instincts, dear {sign}.",
  "The moon's position suggests a good day for {area} matters. Your lucky color {color} will bring positive energy.",
  "An important conversation awaits you today. Your {modality} nature will help you navigate it with grace, {sign}.",
  "Financial opportunities are on the horizon. Your ruling planet {planet} brings abundance to your {area} sector.",
  "A past situation resurfaces today. Use your {trait} nature to handle it differently this time, {sign}.",
  "Love and romance are highlighted today. {sign}, your compatibility with {compatible} signs is especially strong.",
  "Your career path takes an interesting turn. Trust the process — your {element} energy is powerful right now.",
  "Health and wellness take center stage. Listen to your body, especially your {bodyPart}. Rest when needed, {sign}.",
];

export function getZodiacSign(signName: string) {
  const sign = zodiacData.find(s => s.sign === signName.toLowerCase());
  if (!sign) return null;
  
  // Generate daily horoscope
  const template = pick(HOROSCOPE_TEMPLATES);
  const horoscope = template
    .replace(/\{sign\}/g, sign.name)
    .replace(/\{area\}/g, pick(["career", "love", "financial", "creative", "social", "personal growth"]))
    .replace(/\{number\}/g, String(pick(sign.luckyNumbers)))
    .replace(/\{planet\}/g, sign.rulingPlanet)
    .replace(/\{trait\}/g, pick(sign.traits))
    .replace(/\{color\}/g, sign.color)
    .replace(/\{modality\}/g, sign.modality)
    .replace(/\{element\}/g, sign.element)
    .replace(/\{compatible\}/g, pick(sign.compatibility).charAt(0).toUpperCase() + pick(sign.compatibility).slice(1))
    .replace(/\{bodyPart\}/g, sign.bodyPart);

  return {
    ...sign,
    dailyHoroscope: horoscope,
    horoscopeDate: new Date().toISOString().split("T")[0],
    elementsToAvoid: sign.element === "Fire" ? "Water" : sign.element === "Water" ? "Earth" : sign.element === "Earth" ? "Air" : "Fire",
    numbersToAvoid: sign.luckyNumbers.map(n => n + Math.floor(Math.random() * 5 + 1)).filter(n => !sign.luckyNumbers.includes(n)).slice(0, 3),
    activitiesToAvoid: sign.sign === "aries" ? ["Waiting in lines", "Taking orders", "Meditation retreats"] :
                        sign.sign === "taurus" ? ["Rushing decisions", "Lending money", "Multi-tasking"] :
                        sign.sign === "gemini" ? ["Routine work", "Silence", "Commitment"] :
                        sign.sign === "cancer" ? ["Confrontation", "Public speaking", "Cold environments"] :
                        sign.sign === "leo" ? ["Background roles", "Being ignored", "Budget meetings"] :
                        sign.sign === "virgo" ? ["Messy environments", "Procrastination", "Chaos"] :
                        sign.sign === "libra" ? ["Making quick decisions", "Conflict", "Solitude"] :
                        sign.sign === "scorpio" ? ["Superficial talk", "Betrayal", "Being controlled"] :
                        sign.sign === "sagittarius" ? ["Desk jobs", "Routine", "Commitment"] :
                        sign.sign === "capricorn" ? ["Laziness", "Disorganization", "Emotional outbursts"] :
                        sign.sign === "aquarius" ? ["Conformity", "Tradition", "Small talk"] :
                        ["Reality", "Criticism", "Routine"],
  };
}

export function getAllZodiacSigns() {
  return zodiacData.map(s => ({
    ...s,
    dailyHoroscope: pick(HOROSCOPE_TEMPLATES)
      .replace(/\{sign\}/g, s.name)
      .replace(/\{area\}/g, pick(["career", "love", "financial"]))
      .replace(/\{number\}/g, String(pick(s.luckyNumbers)))
      .replace(/\{planet\}/g, s.rulingPlanet)
      .replace(/\{trait\}/g, pick(s.traits))
      .replace(/\{color\}/g, s.color)
      .replace(/\{modality\}/g, s.modality)
      .replace(/\{element\}/g, s.element)
      .replace(/\{compatible\}/g, pick(s.compatibility))
      .replace(/\{bodyPart\}/g, s.bodyPart),
  }));
}

export function getZodiacByElement(element: string) {
  return zodiacData.filter(s => s.element.toLowerCase() === element.toLowerCase());
}

export function getCompatibility(sign1: string, sign2: string) {
  const s1 = zodiacData.find(s => s.sign === sign1.toLowerCase());
  const s2 = zodiacData.find(s => s.sign === sign2.toLowerCase());
  if (!s1 || !s2) return null;
  
  const isCompatible = s1.compatibility.includes(s2.sign);
  const isIncompatible = s1.incompatibility.includes(s2.sign);
  
  let score: number;
  let description: string;
  
  if (isCompatible) {
    score = 75 + Math.floor(Math.random() * 20);
    description = `${s1.name} and ${s2.name} are highly compatible! Both share ${s1.element === s2.element ? "the same element" : "complementary energies"}, making this a natural and harmonious match.`;
  } else if (isIncompatible) {
    score = 20 + Math.floor(Math.random() * 30);
    description = `${s1.name} and ${s2.name} have a challenging match. Their different approaches to life can create friction, but with understanding, they can learn from each other.`;
  } else {
    score = 40 + Math.floor(Math.random() * 35);
    description = `${s1.name} and ${s2.name} have a moderate match. They need to communicate openly and respect each other's differences to make it work.`;
  }
  
  return { sign1: s1.name, sign2: s2.name, score, description };
}

// ─── GAMES ─────────────────────────────────────────────────────────────────

// Rock Paper Scissors
const RPS_MOVES = ["rock", "paper", "scissors"] as const;
const RPS_EMOJI: Record<string, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };

export function playRPS(playerMove: string) {
  const move = playerMove.toLowerCase();
  if (!RPS_MOVES.includes(move as any)) return null;
  
  const computer = pick(RPS_MOVES);
  let result: string;
  
  if (move === computer) result = "draw";
  else if (
    (move === "rock" && computer === "scissors") ||
    (move === "paper" && computer === "rock") ||
    (move === "scissors" && computer === "paper")
  ) result = "win";
  else result = "lose";
  
  return {
    player: move,
    playerEmoji: RPS_EMOJI[move],
    computer,
    computerEmoji: RPS_EMOJI[computer],
    result,
    message: result === "win" ? "You win! 🎉" : result === "lose" ? "You lose! 😢" : "It's a draw! 🤝",
  };
}

// Guess the Country
const COUNTRIES = [
  { name: "Kenya", flag: "🇰🇪", hint: "Famous for long-distance runners and the Great Rift Valley" },
  { name: "Nigeria", flag: "🇳🇬", hint: "Most populous country in Africa, known as the Giant of Africa" },
  { name: "Japan", flag: "🇯🇵", hint: "Land of the Rising Sun, known for sushi and bullet trains" },
  { name: "Brazil", flag: "🇧🇷", hint: "Largest country in South America, famous for football and carnival" },
  { name: "France", flag: "🇫🇷", hint: "Known for the Eiffel Tower, wine, and croissants" },
  { name: "Egypt", flag: "🇪🇬", hint: "Home to the Great Pyramids and the Sphinx" },
  { name: "India", flag: "🇮🇳", hint: "Second most populous country, known for curry and the Taj Mahal" },
  { name: "Australia", flag: "🇦🇺", hint: "Continent-country known for kangaroos and the Outback" },
  { name: "Canada", flag: "🇨🇦", hint: "Known for maple syrup, hockey, and politeness" },
  { name: "China", flag: "🇨🇳", hint: "Most populous country, known for the Great Wall and pandas" },
  { name: "South Africa", flag: "🇿🇦", hint: "Rainbow Nation, home to Nelson Mandela" },
  { name: "Italy", flag: "🇮🇹", hint: "Shaped like a boot, known for pasta and the Colosseum" },
  { name: "Ghana", flag: "🇬🇭", hint: "First sub-Saharan African country to gain independence" },
  { name: "Tanzania", flag: "🇹🇿", hint: "Home to Mount Kilimanjaro and the Serengeti" },
  { name: "United Kingdom", flag: "🇬🇧", hint: "Has a royal family and is famous for tea and crumpets" },
  { name: "Germany", flag: "🇩🇪", hint: "Known for cars, beer, and Oktoberfest" },
  { name: "South Korea", flag: "🇰🇷", hint: "Known for K-pop, kimchi, and Samsung" },
  { name: "Mexico", flag: "🇲🇽", hint: "Known for tacos, mariachi, and ancient pyramids" },
  { name: "Russia", flag: "🇷🇺", hint: "Largest country in the world by area" },
  { name: "Ethiopia", flag: "🇪🇹", hint: "Only African country never colonized, origin of coffee" },
  { name: "Rwanda", flag: "🇷🇼", hint: "Land of a thousand hills, known for mountain gorillas" },
  { name: "Uganda", flag: "🇺🇬", hint: "The Pearl of Africa, source of the Nile" },
  { name: "Morocco", flag: "🇲🇦", hint: "Known for tagine, the Sahara Desert, and colorful markets" },
  { name: "Argentina", flag: "🇦🇷", hint: "Known for tango, Messi, and beef" },
  { name: "Thailand", flag: "🇹🇭", hint: "Known for beautiful beaches, temples, and pad thai" },
];

export function guessCountry() {
  const correct = pick(COUNTRIES);
  const wrongs = shuffle(COUNTRIES.filter(c => c.name !== correct.name)).slice(0, 3);
  const options = shuffle([correct, ...wrongs]).map(c => c.name);
  const correctIndex = options.indexOf(correct.name);
  
  return {
    id: randomId(),
    flag: correct.flag,
    hint: correct.hint,
    options,
    correctIndex,
  };
}

export function checkCountryGuess(gameId: string, answer: string) {
  // Simple check — in production you'd track game state
  const correct = COUNTRIES.find(c => c.name === answer);
  return { correct: !!correct, answer: correct?.name || "Unknown", flag: correct?.flag || "" };
}

// Word Scramble
const SCRAMBLE_WORDS = [
  { word: "elephant", hint: "A large gray animal with a trunk" },
  { word: "computer", hint: "An electronic device for processing data" },
  { word: "mountain", hint: "A large natural elevation of the earth's surface" },
  { word: "chocolate", hint: "A sweet food made from roasted cacao beans" },
  { word: "dinosaur", hint: "An extinct reptile from millions of years ago" },
  { word: "universe", hint: "All of space and everything in it" },
  { word: "python", hint: "A programming language or a large snake" },
  { word: "guitar", hint: "A stringed musical instrument" },
  { word: "ocean", hint: "A vast body of salt water" },
  { word: "volcano", hint: "A mountain that erupts with lava" },
  { word: "safari", hint: "A journey to see wild animals" },
  { word: "galaxy", hint: "A system of millions of stars" },
  { word: "rainbow", hint: "A colorful arc in the sky after rain" },
  { word: "avocado", hint: "A green fruit often used in guacamole" },
  { word: "penguin", hint: "A flightless bird that lives in cold regions" },
];

export function getWordScramble() {
  const entry = pick(SCRAMBLE_WORDS);
  const letters = entry.word.split("");
  let scrambled: string;
  do {
    scrambled = shuffle(letters).join("");
  } while (scrambled === entry.word);
  
  return {
    id: randomId(),
    scrambled,
    hint: entry.hint,
    wordLength: entry.word.length,
    difficulty: entry.word.length <= 5 ? "easy" : entry.word.length <= 7 ? "medium" : "hard",
  };
}

export function checkScramble(id: string, guess: string, word: string) {
  const correct = guess.toLowerCase().trim() === word.toLowerCase();
  return { correct, guess, word, message: correct ? "Correct! 🎉" : "Wrong! Try again" };
}

// Number Guessing
const numberGames = new Map<string, { number: number; attempts: number; min: number; max: number }>();

export function startNumberGame() {
  const id = randomId();
  numberGames.set(id, { number: Math.floor(Math.random() * 100) + 1, attempts: 0, min: 1, max: 100 });
  return { id, range: [1, 100], attemptsLeft: 7, hint: "Guess a number between 1 and 100" };
}

export function guessNumber(id: string, guess: number) {
  const game = numberGames.get(id);
  if (!game) return null;
  
  game.attempts++;
  if (guess === game.number) {
    numberGames.delete(id);
    return { correct: true, message: `Correct! The number was ${game.number}. You got it in ${game.attempts} attempt${game.attempts > 1 ? "s" : ""}! 🎉`, attempts: game.attempts };
  }
  
  if (guess < game.number) game.min = Math.max(game.min, guess + 1);
  else game.max = Math.min(game.max, guess - 1);
  
  if (game.attempts >= 7) {
    numberGames.delete(id);
    return { correct: false, message: `Game over! The number was ${game.number}.`, attempts: game.attempts, gameOver: true };
  }
  
  return {
    correct: false,
    hint: guess < game.number ? "Higher 📈" : "Lower 📉",
    range: [game.min, game.max],
    attemptsLeft: 7 - game.attempts,
  };
}
