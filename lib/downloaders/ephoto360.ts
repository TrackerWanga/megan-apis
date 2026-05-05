const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface EphotoEffect {
  id: string;
  name: string;
  slug: string;
  category: string;
  params: { name: string; type: "text" | "image"; placeholder?: string }[];
}

export interface EphotoResult {
  success: boolean;
  creator: string;
  effectName?: string;
  imageUrl?: string;
  error?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const EPHOTO_SUBCATEGORIES = [
  { id: "text-effects", name: "Text Effects" },
  { id: "3d-effect", name: "3D Effect" },
  { id: "christmas", name: "Merry Christmas" },
  { id: "new-year", name: "Happy New Year" },
  { id: "game-effect", name: "Game Effect" },
  { id: "love", name: "Love" },
  { id: "happy-birthday", name: "Happy Birthday" },
  { id: "fire-effects", name: "Fire Effects" },
  { id: "halloween", name: "Halloween" },
  { id: "tattoo-effects", name: "Tattoo Effects" },
  { id: "artistic-effect", name: "Artistic Effect" },
  { id: "drawing-effects", name: "Drawing Effects" },
  { id: "cup-effects", name: "Cup Effects" },
  { id: "coins-effects", name: "Coins Effects" },
  { id: "festival", name: "Festival" },
  { id: "shirt-effect", name: "Shirt Effect" },
  { id: "glass-effect", name: "Glass Effect" },
  { id: "cover-facebook", name: "Cover Facebook" },
  { id: "technology", name: "Technology" },
  { id: "animations", name: "Animations" },
  { id: "sport-effects", name: "Sport Effects" },
  { id: "video-effect", name: "Video Effect" },
];

export const EPHOTO_EFFECTS: EphotoEffect[] = [
  { id: "neon", name: "Classic Neon Text", slug: "neon-text-effect-171", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Neon text" }] },
  { id: "colorfulglow", name: "Colorful Glow Neon", slug: "create-colorful-neon-light-text-effects-online-797", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Glow text" }] },
  { id: "advancedglow", name: "Advanced Glow Effect", slug: "advanced-glow-effects-74", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Glow text" }] },
  { id: "neononline", name: "Neon Text Online", slug: "neon-text-effect-68", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Neon text" }] },
  { id: "blueneon", name: "Blue Neon Light", slug: "blue-neon-text-effect-117", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Blue neon text" }] },
  { id: "neontext", name: "Neon Text Effect", slug: "neon-text-effect-online-78", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Line 1" }, { name: "text2", type: "text", placeholder: "Line 2" }] },
  { id: "neonlight", name: "Neon Light Text", slug: "neon-text-effect-light-200", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Light text" }] },
  { id: "greenneon", name: "Green Neon Text", slug: "green-neon-text-effect-395", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Green neon" }] },
  { id: "greenlightneon", name: "Green Light Neon", slug: "create-light-effects-green-neon-online-429", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Green light" }] },
  { id: "blueneonlogo", name: "Neon Logo Text", slug: "create-a-blackpink-neon-logo-text-effect-online-710", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Logo text" }] },
  { id: "galaxyneon", name: "Galaxy Text Effect", slug: "galaxy-text-effect-116", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Galaxy text" }] },
  { id: "retroneon", name: "Retro Text Effect", slug: "retro-text-effect-67", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Retro text" }] },
  { id: "multicolorneon", name: "Multicolor 3D Text", slug: "multicolor-3d-paper-cut-style-text-effect-658", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Multi text" }] },
  { id: "hackerneon", name: "Galaxy Neon Light", slug: "making-neon-light-text-effect-with-galaxy-style-521", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Galaxy neon text" }] },
  { id: "devilwings", name: "Devil Wings Neon", slug: "neon-devil-wings-text-effect-online-683", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Devil text" }] },
  { id: "glowtext", name: "Glowing Text Effect", slug: "create-glowing-text-effects-online-706", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Glow text" }] },
  { id: "neonglitch", name: "Digital Glitch Neon", slug: "create-digital-glitch-text-effects-online-767", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Glitch text" }] },
  { id: "neonwall", name: "Galaxy Text New", slug: "galaxy-text-effect-new-258", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Galaxy text" }] },
  { id: "led", name: "Colorful Glow Text", slug: "colorful-glowing-text-effect-69", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Glow text" }] },
  { id: "writeonwetglass", name: "Write on Wet Glass", slug: "write-text-on-wet-glass-online-589", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Wet glass text" }] },
  { id: "deadpool", name: "Deadpool Logo Style", slug: "create-text-effects-in-the-style-of-the-deadpool-logo-818", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Logo text" }, { name: "text2", type: "text", placeholder: "Deadpool" }] },
  { id: "dragonball", name: "Dragon Ball Style", slug: "create-dragon-ball-style-text-effects-online-809", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "DB text" }] },
  { id: "typographypavement", name: "Typography Pavement", slug: "create-typography-text-effect-on-pavement-online-774", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Pavement text" }] },
  { id: "blackpinklogo", name: "Blackpink Style Logo", slug: "create-blackpink-logo-online-free-607", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Logo text" }] },
  { id: "bornpink", name: "Born Pink Album Logo", slug: "create-blackpink-s-born-pink-album-logo-online-779", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Album text" }, { name: "text2", type: "text", placeholder: "Born Pink" }] },
  { id: "frozen", name: "Frozen Text", slug: "ice-text-effect-online-101", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Frozen text" }] },
  { id: "gold", name: "Gold Text", slug: "gold-text-effect-158", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Gold text" }] },
  { id: "horror", name: "Horror Text", slug: "writing-horror-text-online-266", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Horror text" }] },
  { id: "blood", name: "Blood Text", slug: "write-blood-text-on-the-wall-264", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Blood text" }] },
  { id: "lava", name: "Lava Text", slug: "dragon-fire-text-effect-111", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Lava text" }] },
  { id: "thunder", name: "Thunder Text", slug: "thunder-text-effect-online-97", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Thunder text" }] },
  { id: "matrix", name: "Matrix Text", slug: "matrix-text-effect-154", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Matrix text" }] },
  { id: "smoke", name: "Smoke Text", slug: "halloween-fire-text-online-83", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Smoke text" }] },
  { id: "naruto", name: "Naruto Shippuden Style", slug: "naruto-shippuden-logo-style-text-effect-online-808", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Naruto text" }] },
  { id: "avengers3d", name: "Avengers Text Style", slug: "gemstone-text-effect-283", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Avengers text" }] },
  { id: "americanflag3d", name: "American Flag Text", slug: "free-online-american-flag-3d-text-effect-generator-725", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "USA text" }] },

  { id: "wooden3d", name: "Wooden 3D Text", slug: "3d-wooden-text-effects-online-104", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Wood text" }] },
  { id: "cubic3d", name: "Cubic 3D Text", slug: "3d-cubic-text-effect-online-88", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Cubic text" }] },
  { id: "wooden3donline", name: "Wooden 3D Online", slug: "wooden-3d-text-effect-59", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Wood text" }] },
  { id: "water3d", name: "Water 3D Text", slug: "water-text-effects-online-106", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Water text" }] },
  { id: "text3d", name: "3D Text Effect", slug: "create-3d-text-effect-online-812", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "3D text" }] },
  { id: "graffiti3d", name: "3D Graffiti Text", slug: "graffiti-text-5-180", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Graffiti text" }] },
  { id: "silver3d", name: "Glossy Silver 3D", slug: "create-glossy-silver-3d-text-effect-online-802", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Silver text" }] },
  { id: "style3d", name: "3D Style Text", slug: "create-3d-style-text-effects-online-811", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Style text" }] },
  { id: "metal3d", name: "Metallic 3D Text", slug: "metal-text-effect-online-110", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Metal text" }] },
  { id: "comic3d", name: "3D Comic Style Text", slug: "create-online-3d-comic-style-text-effects-817", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Comic text" }] },
  { id: "hologram3d", name: "Hologram 3D Text", slug: "free-create-a-3d-hologram-text-effect-441", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Holo text" }] },
  { id: "gradient3d", name: "Gradient 3D Text", slug: "create-3d-gradient-text-effect-online-686", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Gradient text" }] },
  { id: "stone3d", name: "Stone 3D Text", slug: "3d-ruby-stone-text-281", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Stone text" }] },
  { id: "space3d", name: "Space 3D Text", slug: "latest-space-3d-text-effect-online-559", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Space text" }, { name: "text2", type: "text", placeholder: "Text Effect" }] },
  { id: "sand3d", name: "Sand 3D Text", slug: "realistic-3d-sand-text-effect-online-580", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Sand text" }] },
  { id: "snow3d", name: "Snow 3D Text", slug: "create-a-snow-3d-text-effect-free-online-621", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Snow text" }] },
  { id: "papercut3d", name: "Paper Cut 3D Text", slug: "free-online-art-paper-cut-text-effects-695", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Paper text" }] },
  { id: "balloon3d", name: "Balloon 3D Text", slug: "balloon-text-effects-online-105", category: "3d-effect", params: [{ name: "text", type: "text", placeholder: "Balloon text" }] },

  { id: "christmas3d", name: "Christmas 3D Text", slug: "christmas-effect-by-name-376", category: "christmas", params: [{ name: "text", type: "text", placeholder: "Merry Xmas" }] },
  { id: "christmas-sparkles", name: "Sparkles Christmas Text", slug: "create-sparkles-3d-christmas-text-effect-online-727", category: "christmas", params: [{ name: "text", type: "text", placeholder: "Christmas text" }] },
  { id: "christmas-snow3d", name: "Christmas Snow 3D Text", slug: "create-a-beautiful-3d-christmas-snow-text-effect-793", category: "christmas", params: [{ name: "text", type: "text", placeholder: "Christmas text" }] },
  { id: "christmas-frozen", name: "Frozen Christmas Text", slug: "create-a-frozen-christmas-text-effect-online-792", category: "christmas", params: [{ name: "text", type: "text", placeholder: "Frozen Xmas" }] },
  { id: "christmas-gold", name: "Christmas Gold Glitter", slug: "christmas-and-new-year-glittering-3d-golden-text-effect-794", category: "christmas", params: [{ name: "text", type: "text", placeholder: "Gold text" }] },

  { id: "newyear-gold", name: "New Year Gold Text", slug: "christmas-and-new-year-glittering-3d-golden-text-effect-794", category: "new-year", params: [{ name: "text", type: "text", placeholder: "Happy New Year" }] },

  { id: "pubglogo", name: "PUBG Logo Maker", slug: "pubg-logo-maker-cute-character-online-617", category: "game-effect", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "pubglogo2", name: "PUBG Girl Logo Maker", slug: "free-pubg-logo-maker-online-609", category: "game-effect", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "pubgesports", name: "PUBG Esports Team Logo", slug: "pubg-mascot-logo-maker-for-an-esports-team-612", category: "game-effect", params: [{ name: "text", type: "text", placeholder: "Team name" }] },
  { id: "warzonecover", name: "Call of Duty Warzone Banner", slug: "create-call-of-duty-warzone-youtube-banner-online-548", category: "game-effect", params: [{ name: "text", type: "text", placeholder: "Channel name" }] },
  { id: "aovbanner", name: "Arena of Valor Banner", slug: "generate-banner-arena-of-valor-aov-with-name-440", category: "game-effect", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "valorantbanner", name: "Valorant YouTube Banner", slug: "create-valorant-banner-youtube-online-588", category: "game-effect", params: [{ name: "text", type: "text", placeholder: "Channel name" }, { name: "text2", type: "text", placeholder: "Games" }, { name: "text3", type: "text", placeholder: "@handle" }] },

  { id: "birthday3d", name: "Birthday 3D Text", slug: "create-birthday-cards-by-3d-names-373", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Happy Birthday" }] },
  { id: "pubgbirthday", name: "PUBG Birthday Cake", slug: "write-name-on-pubg-birthday-cake-images-522", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "flowerbirthday", name: "Flower Birthday Cake", slug: "write-name-on-flower-birthday-cake-pics-472", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "chocolatecake", name: "Chocolate Birthday Cake", slug: "chocolate-birthday-cake-with-candle-with-name-generator-461", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "rosecake", name: "Heart Rose Birthday Cake", slug: "heart-shaped-rose-birthday-cake-with-name-edit-469", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "amazingflowercake", name: "Amazing Flower Birthday Cake", slug: "amazing-flower-birthday-cake-with-name-generator-465", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "redrosebirthday", name: "Red Rose Birthday Cake", slug: "write-name-on-red-rose-birthday-cake-images-462", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "greetingcake", name: "Birthday Greeting Cake", slug: "write-a-greeting-on-the-birthday-cake-229", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "anniversarycake", name: "Anniversary Birthday Cake", slug: "romantic-anniversary-birthday-cake-with-name-edit-473", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "romanticflowercake", name: "Romantic Flower Birthday Cake", slug: "romantic-flower-heart-birthday-cake-by-name-edit-466", category: "happy-birthday", params: [{ name: "text", type: "text", placeholder: "Your name" }] },

  { id: "fire", name: "Fire Text Effect", slug: "flame-lettering-effect-372", category: "fire-effects", params: [{ name: "text", type: "text", placeholder: "Fire text" }] },
  { id: "flamelettering", name: "Flame Lettering", slug: "flame-lettering-effect-372", category: "fire-effects", params: [{ name: "text", type: "text", placeholder: "Flame text" }] },

  { id: "horrorcemetery", name: "Horror Cemetery Name", slug: "write-your-name-on-horror-cemetery-gate-597", category: "halloween", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "halloweentheme", name: "Halloween Theme Text", slug: "create-halloween-theme-text-321", category: "halloween", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "bloodwall", name: "Blood Text on Wall", slug: "write-blood-text-on-the-wall-264", category: "halloween", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "frankensteintext", name: "Frankenstein Horror Text", slug: "write-frankenstain-halloween-style-text-322", category: "halloween", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "horrormetal", name: "Horror Letters on Metal", slug: "writing-horror-letters-on-metal-plates-265", category: "halloween", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "halloweentext", name: "Halloween Text Effect", slug: "text-halloween-80", category: "halloween", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "halloweeneffect", name: "Halloween Neon Text", slug: "text-effect-halloween-online-79", category: "halloween", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "horrortext", name: "Horror Text Online", slug: "writing-horror-text-online-266", category: "halloween", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "halloweencard", name: "Halloween Card Text", slug: "cards-halloween-online-81", category: "halloween", params: [{ name: "text", type: "text", placeholder: "Your name" }] },

  { id: "foilballoon3d", name: "3D Foil Balloon Text", slug: "beautiful-3d-foil-balloon-effects-for-holidays-and-birthday-803", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "colorfulpaint3d", name: "3D Colorful Paint Text", slug: "create-3d-colorful-paint-text-effect-online-801", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Your text" }] },
  { id: "blackpinksignature", name: "Blackpink Signature Logo", slug: "create-a-blackpink-style-logo-with-members-signatures-810", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "dragonballtext", name: "Dragon Ball Text Effect", slug: "create-dragon-ball-style-text-effects-online-809", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "glossysilver3d", name: "Glossy Silver 3D Text", slug: "create-glossy-silver-3d-text-effect-online-802", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Your text" }] },
  { id: "typographyart", name: "Typography Art Layers", slug: "create-online-typography-art-effects-with-multiple-layers-811", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Your text" }] },
  { id: "foggyglass", name: "Handwritten Foggy Glass Text", slug: "handwritten-text-on-foggy-glass-online-680", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "narutologo", name: "Naruto Shippuden Logo Text", slug: "naruto-shippuden-logo-style-text-effect-online-808", category: "text-effects", params: [{ name: "text", type: "text", placeholder: "Your name" }] },

  { id: "nametattoo", name: "Name Tattoo Online", slug: "make-tattoos-online-by-your-name-309", category: "tattoo-effects", params: [{ name: "text", type: "text", placeholder: "Your name" }] },

  { id: "sunlightshadow", name: "Sunlight Shadow Love Text", slug: "sunlight-shadow-text-204", category: "love", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "heartwinggif", name: "Heart Wings Name GIF", slug: "write-name-on-heart-with-wings-gifs-430", category: "love", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "loveballoons", name: "Love Balloons Card", slug: "create-love-balloons-cards-334", category: "love", params: [{ name: "text", type: "text", placeholder: "Name 1" }, { name: "text2", type: "text", placeholder: "Name 2" }] },

  { id: "cfcover", name: "CrossFire Facebook Cover", slug: "create-a-cover-cf-under-your-name-300", category: "cover-facebook", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "lolcover", name: "League of Legends Cover", slug: "create-a-league-of-legends-cover-by-name-302", category: "cover-facebook", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "csgocover", name: "CS:GO Facebook Cover", slug: "create-cs-go-cover-with-name-233", category: "cover-facebook", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "dota2cover", name: "Dota 2 Facebook Cover", slug: "create-dota-2-cover-with-name-238", category: "cover-facebook", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "overwatchcover", name: "Overwatch Facebook Cover", slug: "create-overwatch-cover-by-name-292", category: "cover-facebook", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "onepiececover", name: "One Piece Facebook Cover", slug: "create-one-piece-facebook-cover-online-553", category: "cover-facebook", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
  { id: "dragonballcover", name: "Dragon Ball Facebook Cover", slug: "free-online-dragon-ball-facebook-cover-photos-maker-443", category: "cover-facebook", params: [{ name: "text", type: "text", placeholder: "Your name" }] },

  { id: "youtubebutton", name: "YouTube Gold Play Button", slug: "create-silver-button-gold-button-social-network-online-450", category: "technology", params: [{ name: "text", type: "text", placeholder: "Channel name" }] },

  { id: "examcrank", name: "Exam Crank 3D Animation", slug: "animate-general-exam-crank-149", category: "animations", params: [{ name: "text", type: "text", placeholder: "Your name" }] },
];

export async function generateEphoto(effectSlug: string, texts: string[]): Promise<EphotoResult> {
  const effect = EPHOTO_EFFECTS.find(e => e.slug === effectSlug || e.id === effectSlug);
  const effectName = effect?.name || effectSlug;
  const slug = effect?.slug || effectSlug;

  try {
    const pageUrl = `https://en.ephoto360.com/${slug}.html`;
    const pageRes = await fetchWithTimeout(pageUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });

    if (!pageRes.ok) {
      return { success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", error: `Effect page not found (${pageRes.status})` };
    }

    const pageHtml = await pageRes.text();
    const cookies = pageRes.headers.get("set-cookie") || "";

    const tokenMatch = pageHtml.match(/name="token"\s+value="([^"]+)"/);
    const buildServerMatch = pageHtml.match(/name="build_server"\s+value="([^"]+)"/);
    const buildServerIdMatch = pageHtml.match(/name="build_server_id"\s+value="([^"]+)"/);

    if (!tokenMatch || !buildServerMatch) {
      return { success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", error: "Could not extract form tokens" };
    }

    const token = tokenMatch[1];
    const buildServer = buildServerMatch[1];
    const buildServerId = buildServerIdMatch?.[1] || "1";

    const radioMatch = pageHtml.match(/type="radio"[^>]+name="([^"]+)"[^>]+value="([^"]+)"/);
    const radioName = radioMatch?.[1] || null;
    const radioValue = radioMatch?.[2] || null;

    const formData = new URLSearchParams();
    for (const t of texts) {
      formData.append("text[]", t);
    }
    if (radioName && radioValue) {
      formData.append(radioName, radioValue);
    }
    formData.append("token", token);
    formData.append("build_server", buildServer);
    formData.append("build_server_id", buildServerId);
    formData.append("submit", "GO");

    const cookieHeader = cookies.split(",").map(c => c.split(";")[0].trim()).filter(Boolean).join("; ");

    const postRes = await fetchWithTimeout(pageUrl, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer": pageUrl,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: formData.toString(),
    });

    const postHtml = await postRes.text();
    const postCookies = postRes.headers.get("set-cookie") || "";
    const allCookies = [cookieHeader, ...postCookies.split(",").map(c => c.split(";")[0].trim())].filter(Boolean).join("; ");

    const formValueMatch = postHtml.match(/form_value_input"\s+value="([^"]+)"/);
    if (!formValueMatch) {
      return { success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", error: "Could not extract form value for image generation" };
    }

    const formValueRaw = formValueMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#039;/g, "'");

    let formValue: any;
    try {
      formValue = JSON.parse(formValueRaw);
    } catch {
      return { success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", error: "Invalid form value data" };
    }

    const createData = new URLSearchParams();
    createData.append("id", formValue.id || "");
    if (Array.isArray(formValue.text)) {
      for (const t of formValue.text) {
        createData.append("text[]", t);
      }
    }
    for (const [key, val] of Object.entries(formValue)) {
      if (key.startsWith("radio") && val !== null && typeof val === "object") {
        for (const [subKey, subVal] of Object.entries(val as Record<string, string>)) {
          createData.append(`${key}[${subKey}]`, subVal);
        }
      }
    }
    createData.append("token", formValue.token || "");
    createData.append("build_server", formValue.build_server || "");
    createData.append("build_server_id", formValue.build_server_id || "");

    let imageResult: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const createRes = await fetchWithTimeout("https://en.ephoto360.com/effect/create-image", {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": pageUrl,
          ...(allCookies ? { Cookie: allCookies } : {}),
        },
        body: createData.toString(),
      });

      const createText = await createRes.text();
      try {
        imageResult = JSON.parse(createText);
        if (imageResult.success === true && imageResult.image) {
          break;
        }
      } catch {
        // retry
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!imageResult || !imageResult.success || !imageResult.image) {
      return { success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", error: "Image generation failed after multiple attempts" };
    }

    const imageUrl = `${formValue.build_server}${imageResult.image}`;

    return {
      success: true,
      creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech",
      effectName,
      imageUrl,
    };
  } catch (err: any) {
    return { success: false, creator: "Megan APIs v3.6.4 | Tracker Wanga | Falcon Tech", error: err.message || "Ephoto360 generation failed" };
  }
}

export function listEphotoEffects() {
  return EPHOTO_EFFECTS
    .filter(e => e.slug && e.params)
    .map(e => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      category: e.category,
      endpoint: `/api/ephoto/${e.id}`,
      params: e.params!.map(p => ({ name: p.name, type: p.type, placeholder: p.placeholder })),
    }));
}
