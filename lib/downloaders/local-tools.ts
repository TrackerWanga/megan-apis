export function getAge(birthDate: string) {
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) years--;
  const totalDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  const nextBirthday = new Date(now.getFullYear() + (months < 0 ? 0 : 1), birth.getMonth(), birth.getDate());
  const daysUntil = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { success: true, birthDate, age: years, totalDays, daysUntilNextBirthday: daysUntil, nextBirthday: nextBirthday.toISOString().split("T")[0] };
}

export function wordCount(text: string) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const readingTime = Math.ceil(words.length / 200);
  return { success: true, words: words.length, characters: chars, charactersNoSpaces: charsNoSpaces, sentences, paragraphs, readingTimeMinutes: readingTime };
}

export function textReverse(text: string) {
  return { success: true, original: text, reversed: text.split("").reverse().join(""), reversedWords: text.split(" ").reverse().join(" ") };
}

export function randomNumber(min = 1, max = 100) {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return { success: true, number: num, min, max };
}

export function coinFlip() {
  const result = Math.random() < 0.5 ? "heads" : "tails";
  return { success: true, result, emoji: result === "heads" ? "🪙" : "💰" };
}

export function diceRoll(sides = 6) {
  return { success: true, result: Math.floor(Math.random() * sides) + 1, sides };
}

export function generateSlug(text: string) {
  return { success: true, original: text, slug: text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") };
}

export function loremIpsum(paragraphs = 3) {
  const words = ["lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do","eiusmod","tempor","incididunt","ut","labore","et","dolore","magna","aliqua","enim","ad","minim","veniam","quis","nostrud","exercitation","ullamco","laboris","nisi","ut","aliquip","ex","ea","commodo","consequat","duis","aute","irure","dolor","in","reprehenderit","in","voluptate","velit","esse","cillum","dolore","eu","fugiat","nulla","pariatur","excepteur","sint","occaecat","cupidatat","non","proident","sunt","in","culpa","qui","officia","deserunt","mollit","anim","id","est","laborum"];
  const result = [];
  for (let p = 0; p < paragraphs; p++) {
    const sentenceCount = 3 + Math.floor(Math.random() * 5);
    const paragraph = [];
    for (let s = 0; s < sentenceCount; s++) {
      const wordCount = 5 + Math.floor(Math.random() * 12);
      const sentence = [];
      for (let w = 0; w < wordCount; w++) {
        sentence.push(words[Math.floor(Math.random() * words.length)]);
      }
      paragraph.push(sentence.join(" ") + ".");
    }
    result.push(paragraph.join(" "));
  }
  return { success: true, paragraphs, text: result.join("\n\n") };
}
