import * as crypto from "crypto";

// ─── TIME & DATE ─────────────────────────────────────
export function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const day = Math.floor(diff / (1000 * 60 * 60 * 24));
  const total = (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || now.getFullYear() % 400 === 0 ? 366 : 365;
  return { success: true, dayOfYear: day, totalDays: total, remaining: total - day, date: now.toISOString().split("T")[0] };
}

export function getCountdown(targetDate: string) {
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff < 0) return { success: true, passed: true, since: Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24))) + " days ago" };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { success: true, target: targetDate, days, hours, minutes, seconds, totalSeconds: Math.floor(diff / 1000) };
}

// ─── MATH ────────────────────────────────────────────
export function isPrime(n: number) {
  if (n < 2) return { success: true, number: n, prime: false };
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return { success: true, number: n, prime: false, divisibleBy: i };
  }
  return { success: true, number: n, prime: true };
}

export function factorial(n: number) {
  if (n < 0) return { success: false, error: "Negative numbers not allowed" };
  if (n > 170) return { success: false, error: "Number too large (max 170)" };
  let result = BigInt(1);
  for (let i = 2; i <= n; i++) result *= BigInt(i);
  return { success: true, number: n, factorial: result.toString() };
}

export function fibonacci(count: number) {
  if (count < 1) return { success: false, error: "Count must be at least 1" };
  if (count > 100) return { success: false, error: "Max 100 numbers" };
  const seq = [0];
  if (count > 1) seq.push(1);
  for (let i = 2; i < count; i++) seq.push(seq[i - 1] + seq[i - 2]);
  return { success: true, count, sequence: seq };
}

export function calculateBMI(weight: number, height: number, unit: "metric" | "imperial" = "metric") {
  let bmi: number;
  if (unit === "imperial") {
    bmi = (weight / (height * height)) * 703;
  } else {
    bmi = weight / ((height / 100) * (height / 100));
  }
  bmi = Math.round(bmi * 10) / 10;
  let category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  return { success: true, bmi, category, unit, weight, height };
}

// ─── ENCODING ────────────────────────────────────────
export function hexEncode(text: string) {
  return { success: true, original: text, encoded: Buffer.from(text).toString("hex") };
}
export function hexDecode(hex: string) {
  return { success: true, encoded: hex, decoded: Buffer.from(hex, "hex").toString("utf8") };
}

export function binaryEncode(text: string) {
  return { success: true, original: text, encoded: text.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ") };
}
export function binaryDecode(binary: string) {
  return { success: true, encoded: binary, decoded: binary.split(" ").map(b => String.fromCharCode(parseInt(b, 2))).join("") };
}

export function rot13(text: string) {
  const result = text.replace(/[a-zA-Z]/g, c => 
    String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = String.fromCharCode(c.charCodeAt(0) + 13)) ? c.charCodeAt(0) : c.charCodeAt(0) - 26)
  );
  return { success: true, original: text, transformed: result };
}

export function morseEncode(text: string) {
  const morse: Record<string, string> = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---",
    K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-",
    U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..", "0": "-----", "1": ".----",
    "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..",
    "9": "----.", " ": "/", ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--",
  };
  const encoded = text.toUpperCase().split("").map(c => morse[c] || c).join(" ");
  return { success: true, original: text, morse: encoded };
}

export function jwtDecode(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { success: false, error: "Invalid JWT format" };
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return { success: true, header, payload, signature: parts[2] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── QR ADVANCED ─────────────────────────────────────
export function generateWiFiQR(ssid: string, password: string, encryption: "WPA" | "WEP" | "nopass" = "WPA") {
  const data = `WIFI:T:${encryption};S:${ssid};P:${password};;`;
  return { success: true, ssid, encryption, qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}` };
}

export function generateVCardQR(name: string, phone?: string, email?: string, org?: string) {
  let data = "BEGIN:VCARD\nVERSION:3.0\n";
  data += `FN:${name}\n`;
  if (phone) data += `TEL:${phone}\n`;
  if (email) data += `EMAIL:${email}\n`;
  if (org) data += `ORG:${org}\n`;
  data += "END:VCARD";
  return { success: true, name, phone, email, org, qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}` };
}

// ─── FUN ─────────────────────────────────────────────
const EIGHTBALL = [
  "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.",
  "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
  "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
  "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
  "Don't count on it.", "My reply is no.", "My sources say no.", "Outlook not so good.", "Very doubtful."
];

export function magic8Ball() {
  const answer = EIGHTBALL[Math.floor(Math.random() * EIGHTBALL.length)];
  return { success: true, answer, emoji: answer.includes("yes") || answer.includes("certain") || answer.includes("likely") ? "🟢" : answer.includes("no") || answer.includes("doubt") ? "🔴" : "🟡" };
}

export function getThisDayInHistory() {
  const today = new Date();
  const month = today.toLocaleString("en-US", { month: "long" });
  const day = today.getDate();
  
  const events: Record<string, string[]> = {
    "January": ["1801: The United Kingdom of Great Britain and Ireland was formed.", "1927: First transatlantic telephone call was made.", "2004: Spirit rover landed on Mars."],
    "February": ["1922: The first issue of Reader's Digest was published.", "1964: The Beatles arrived in the US.", "1996: Deep Blue beat Garry Kasparov in chess."],
    "March": ["1876: Alexander Graham Bell made the first telephone call.", "1931: The Star-Spangled Banner became the US national anthem.", "1989: The World Wide Web was invented by Tim Berners-Lee."],
    "April": ["1912: The Titanic sank.", "1961: Yuri Gagarin became the first human in space.", "1970: Apollo 13 launched."],
    "May": ["1931: The Empire State Building was dedicated.", "1945: Germany surrendered, ending WWII in Europe.", "1961: JFK announced goal to put a man on the moon."],
    "June": ["1944: D-Day invasion of Normandy.", "1969: Stonewall riots began.", "1977: Apple II computer went on sale."],
    "July": ["1776: US Declaration of Independence adopted.", "1969: Apollo 11 landed on the moon.", "2000: First human genome draft completed."],
    "August": ["1945: Japan surrendered, ending WWII.", "1963: Martin Luther King Jr. gave 'I Have a Dream' speech.", "1991: The World Wide Web became publicly available."],
    "September": ["1939: WWII began with invasion of Poland.", "1962: Spider-Man first appeared in comics.", "2001: 9/11 attacks on the United States."],
    "October": ["1957: Sputnik 1 was launched.", "1969: First message sent over ARPANET.", "2001: iPod was introduced by Apple."],
    "November": ["1918: WWI ended.", "1963: JFK was assassinated.", "1989: Berlin Wall fell."],
    "December": ["1955: Rosa Parks refused to give up her bus seat.", "1972: Apollo 17, the last moon mission, launched.", "1990: Tim Berners-Lee created the first web browser."],
  };
  
  const monthEvents = events[month] || ["Nothing notable recorded."];
  const selected = monthEvents.filter(e => {
    const d = parseInt(e.split(":")[0].split(" ")[1]);
    return Math.abs(d - day) <= 3;
  });
  
  return { success: true, date: `${month} ${day}`, events: selected.length > 0 ? selected : monthEvents.slice(0, 3) };
}

export function numberFact(num: number) {
  const facts = [
    `${num} is ${num % 2 === 0 ? "even" : "odd"}`,
    `${num} in binary is ${num.toString(2)}`,
    `${num} in hex is ${num.toString(16)}`,
    `${num} squared is ${num * num}`,
    `${num} cubed is ${num * num * num}`,
    `The square root of ${num} is ${Math.sqrt(num).toFixed(4)}`,
  ];
  return { success: true, number: num, facts: facts.sort(() => Math.random() - 0.5) };
}

const PROGRAMMING_JOKES = [
  { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs!" },
  { setup: "What's a programmer's favorite place?", punchline: "The Foo Bar!" },
  { setup: "Why did the developer go broke?", punchline: "Because they used up all their cache!" },
  { setup: "What's the best thing about UDP jokes?", punchline: "I don't care if you get them." },
  { setup: "Why do Java developers wear glasses?", punchline: "Because they can't C#!" },
  { setup: "A SQL query walks into a bar...", punchline: "...sees two tables and asks: 'Can I join you?'" },
  { setup: "How many programmers does it take to change a light bulb?", punchline: "None, it's a hardware problem!" },
  { setup: "Why was the JavaScript developer sad?", punchline: "Because they didn't Node how to Express their feelings." },
  { setup: "What's a programmer's favorite hangout spot?", punchline: "The loop!" },
  { setup: "Why did the function stop calling itself?", punchline: "It hit its base case!" },
];

export function programmingJoke() {
  return { success: true, ...PROGRAMMING_JOKES[Math.floor(Math.random() * PROGRAMMING_JOKES.length)] };
}
