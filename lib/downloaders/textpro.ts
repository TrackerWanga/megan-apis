import { TEXTPRO_EFFECTS } from "../../shared/schema";

const COOLTEXT_API = "https://cooltext.com/PostChange";

export async function listTextproEffects() {
  return TEXTPRO_EFFECTS.map((e) => ({
    id: e.id,
    name: e.name,
    endpoint: `/api/textpro/generate?effect=${e.id}&text=YourText`,
  }));
}

export async function generateTextpro(effectId: string, text: string): Promise<string> {
  const effect = TEXTPRO_EFFECTS.find((e) => e.id === effectId);
  if (!effect) throw new Error(`Effect "${effectId}" not found. Use /api/textpro/list to see available effects.`);

  const body = new URLSearchParams({
    LogoID: effect.logoId.toString(),
    Text: text,
    FontSize: "70",
    Integer1: "15",
    Boolean1: "on",
    Integer9: "0",
    Integer13: "on",
    Integer12: "on",
    ...effect.params,
  });

  const res = await fetch(COOLTEXT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Text effect generation failed: ${res.status}`);

  const data = await res.json() as any;
  if (!data.renderLocation) throw new Error("Failed to generate text effect image");

  return data.renderLocation;
}
