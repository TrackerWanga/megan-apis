export const AUDIO_EFFECTS = [
  { id: "bass", name: "Bass", description: "Enhance low-frequency bass tones" },
  { id: "bassboost", name: "Bass Boost", description: "Heavy bass boost effect" },
  { id: "robot", name: "Robot", description: "Robotic voice transformation" },
  { id: "chipmunk", name: "Chipmunk", description: "High-pitched chipmunk voice" },
  { id: "deep", name: "Deep Voice", description: "Lower pitch for deep voice effect" },
  { id: "echo", name: "Echo", description: "Add echo/delay effect" },
  { id: "reverb", name: "Reverb", description: "Add room reverb effect" },
  { id: "nightcore", name: "Nightcore", description: "Speed up with higher pitch" },
  { id: "slowed", name: "Slowed", description: "Slow down with lower pitch (slowed + reverb)" },
  { id: "8d", name: "8D Audio", description: "Simulated 8D surround sound panning" },
  { id: "vaporwave", name: "Vaporwave", description: "Slow, dreamy aesthetic sound" },
  { id: "karaoke", name: "Karaoke", description: "Remove vocals (center channel removal)" },
  { id: "treble", name: "Treble Boost", description: "Enhance high-frequency treble tones" },
  { id: "distortion", name: "Distortion", description: "Add audio distortion/overdrive" },
  { id: "flanger", name: "Flanger", description: "Flanging modulation effect" },
  { id: "phaser", name: "Phaser", description: "Phase shifting effect" },
  { id: "chorus", name: "Chorus", description: "Chorus doubling effect" },
  { id: "vibrato", name: "Vibrato", description: "Pitch vibrato modulation" },
  { id: "tremolo", name: "Tremolo", description: "Volume tremolo modulation" },
  { id: "reverse", name: "Reverse", description: "Play audio in reverse" },
  { id: "speed2x", name: "Speed 2x", description: "Double speed playback" },
  { id: "slow05x", name: "Slow 0.5x", description: "Half speed playback" },
  { id: "telephone", name: "Telephone", description: "Telephone/radio bandpass filter" },
  { id: "underwater", name: "Underwater", description: "Muffled underwater sound effect" },
  { id: "megaphone", name: "Megaphone", description: "Megaphone/loudspeaker effect" },
];

const FFMPEG_FILTERS: Record<string, string> = {
  bass: "equalizer=f=100:width_type=h:width=200:g=10",
  bassboost: "equalizer=f=80:width_type=h:width=200:g=20,equalizer=f=40:width_type=h:width=100:g=15",
  robot: "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75",
  chipmunk: "asetrate=44100*1.5,aresample=44100,atempo=0.75",
  deep: "asetrate=44100*0.7,aresample=44100,atempo=1.3",
  echo: "aecho=0.8:0.88:60:0.4",
  reverb: "aecho=0.8:0.9:1000|1800:0.3|0.25",
  nightcore: "asetrate=44100*1.25,aresample=44100",
  slowed: "asetrate=44100*0.8,aresample=44100,aecho=0.8:0.88:60:0.4",
  "8d": "apulsator=mode=sine:hz=0.125",
  vaporwave: "asetrate=44100*0.75,aresample=44100,aecho=0.8:0.85:500:0.3",
  karaoke: "pan=stereo|c0=c0-c1|c1=c1-c0",
  treble: "equalizer=f=5000:width_type=h:width=2000:g=10",
  distortion: "overdrive=gain=15:colour=50",
  flanger: "flanger=delay=5:depth=5:speed=0.5",
  phaser: "aphaser=speed=0.5:decay=0.6",
  chorus: "chorus=0.7:0.9:55:0.4:0.25:2",
  vibrato: "vibrato=f=8:d=0.5",
  tremolo: "tremolo=f=8:d=0.6",
  reverse: "areverse",
  speed2x: "atempo=2.0",
  slow05x: "atempo=0.5",
  telephone: "highpass=f=300,lowpass=f=3400",
  underwater: "lowpass=f=500,aecho=0.8:0.7:100:0.5",
  megaphone: "highpass=f=500,lowpass=f=4000,overdrive=gain=5:colour=30",
};

export function listAudioEffects() {
  return AUDIO_EFFECTS.map(e => ({
    ...e,
    endpoint: `/api/audio/${e.id}`,
    method: "GET",
    params: { url: "Audio/video URL to apply effect to" },
    ffmpegFilter: FFMPEG_FILTERS[e.id] || "N/A",
  }));
}

export async function applyAudioEffect(effectId: string, audioUrl: string): Promise<{ success: boolean; result: any }> {
  const effect = AUDIO_EFFECTS.find(e => e.id === effectId);
  if (!effect) {
    const available = AUDIO_EFFECTS.map(e => e.id).join(", ");
    throw new Error(`Unknown audio effect '${effectId}'. Available: ${available}`);
  }
  if (!audioUrl) throw new Error("Missing 'url' parameter - provide an audio/video URL");

  const filter = FFMPEG_FILTERS[effectId];
  if (!filter) throw new Error(`No filter defined for effect '${effectId}'`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(audioUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
    const contentType = res.headers.get("content-type") || "audio/mpeg";
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const base64 = buffer.toString("base64");
    const mime = contentType.split(";")[0].trim();

    return {
      success: true,
      result: {
        effect: effect.name,
        effectId: effect.id,
        description: effect.description,
        inputFormat: mime,
        outputFormat: "audio/mpeg",
        base64Data: `data:${mime};base64,${base64}`,
        ffmpegCommand: `ffmpeg -i input.mp3 -af "${filter}" output.mp3`,
        ffmpegFilter: filter,
        instructions: `1. Decode the base64 data to get the original audio file. 2. Apply the ${effect.name} effect using ffmpeg: ffmpeg -i input.mp3 -af "${filter}" output.mp3. 3. The output will have the ${effect.name} effect applied.`,
        originalUrl: audioUrl,
        size: buffer.length,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
