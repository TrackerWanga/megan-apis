async function fetchMediaAsBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    if (!res.ok) throw new Error(`Failed to fetch media: ${res.status}`);
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const arrayBuf = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuf), contentType };
  } finally {
    clearTimeout(timeout);
  }
}

function detectMime(url: string, contentType: string): string {
  if (contentType && !contentType.includes("octet-stream")) return contentType.split(";")[0].trim();
  const lower = url.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".gif")) return "image/gif";
  if (lower.includes(".mp4")) return "video/mp4";
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function imageToSticker(imageUrl: string): Promise<{ success: boolean; result: any }> {
  if (!imageUrl) throw new Error("Missing 'url' parameter - provide an image URL");
  const { buffer, contentType } = await fetchMediaAsBuffer(imageUrl);
  const mime = detectMime(imageUrl, contentType);
  const base64 = buffer.toString("base64");
  return {
    success: true,
    result: {
      type: "sticker_data",
      inputFormat: mime,
      outputFormat: "image/webp",
      base64Data: `data:${mime};base64,${base64}`,
      conversionCommand: "ffmpeg -i input.{ext} -vf 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000' output.webp",
      instructions: "1. Decode base64 to get the original image. 2. Convert to WebP (512x512 max) using ffmpeg or sharp. 3. Send as WhatsApp sticker.",
      originalUrl: imageUrl,
      size: buffer.length,
    },
  };
}

export async function stickerToImage(stickerUrl: string): Promise<{ success: boolean; result: any }> {
  if (!stickerUrl) throw new Error("Missing 'url' parameter - provide a sticker/WebP URL");
  const { buffer, contentType } = await fetchMediaAsBuffer(stickerUrl);
  const mime = detectMime(stickerUrl, contentType);
  const base64 = buffer.toString("base64");
  return {
    success: true,
    result: {
      type: "image_data",
      inputFormat: mime,
      outputFormat: "image/png",
      base64Data: `data:${mime};base64,${base64}`,
      conversionCommand: "ffmpeg -i input.webp output.png",
      instructions: "1. Decode base64 to get the WebP sticker. 2. Convert to PNG/JPEG using ffmpeg, sharp, or jimp. 3. Send as image message.",
      originalUrl: stickerUrl,
      size: buffer.length,
    },
  };
}

export async function videoToSticker(videoUrl: string): Promise<{ success: boolean; result: any }> {
  if (!videoUrl) throw new Error("Missing 'url' parameter - provide a video URL (MP4, max 6 seconds for WhatsApp)");
  const { buffer, contentType } = await fetchMediaAsBuffer(videoUrl);
  const mime = detectMime(videoUrl, contentType);
  const base64 = buffer.toString("base64");
  return {
    success: true,
    result: {
      type: "animated_sticker_data",
      inputFormat: mime,
      outputFormat: "image/webp",
      base64Data: `data:${mime};base64,${base64}`,
      conversionCommand: "ffmpeg -i input.mp4 -vf 'scale=512:512:force_original_aspect_ratio=decrease' -loop 0 -t 6 output.webp",
      instructions: "1. Decode base64 to get the video file. 2. Convert to animated WebP (max 512x512, 6 seconds, 1MB) using ffmpeg. 3. Send as WhatsApp animated sticker.",
      originalUrl: videoUrl,
      size: buffer.length,
      limits: { maxDuration: "6 seconds", maxSize: "1MB for WhatsApp animated stickers" },
    },
  };
}

export async function stickerToVideo(stickerUrl: string): Promise<{ success: boolean; result: any }> {
  if (!stickerUrl) throw new Error("Missing 'url' parameter - provide an animated sticker/WebP URL");
  const { buffer, contentType } = await fetchMediaAsBuffer(stickerUrl);
  const mime = detectMime(stickerUrl, contentType);
  const base64 = buffer.toString("base64");
  return {
    success: true,
    result: {
      type: "video_data",
      inputFormat: mime,
      outputFormat: "video/mp4",
      base64Data: `data:${mime};base64,${base64}`,
      conversionCommand: "ffmpeg -i input.webp output.mp4",
      instructions: "1. Decode base64 to get the animated WebP sticker. 2. Convert to MP4 using ffmpeg. 3. Send as video message.",
      originalUrl: stickerUrl,
      size: buffer.length,
    },
  };
}

export async function videoToGif(videoUrl: string): Promise<{ success: boolean; result: any }> {
  if (!videoUrl) throw new Error("Missing 'url' parameter - provide a video URL");
  const { buffer, contentType } = await fetchMediaAsBuffer(videoUrl);
  const mime = detectMime(videoUrl, contentType);
  const base64 = buffer.toString("base64");
  return {
    success: true,
    result: {
      type: "gif_data",
      inputFormat: mime,
      outputFormat: "image/gif",
      base64Data: `data:${mime};base64,${base64}`,
      conversionCommand: "ffmpeg -i input.mp4 -vf 'fps=15,scale=320:-1:flags=lanczos' -gifflags +transdiff output.gif",
      instructions: "1. Decode base64 to get the video file. 2. Convert to GIF using ffmpeg. 3. Send as GIF/animation.",
      originalUrl: videoUrl,
      size: buffer.length,
    },
  };
}

export async function gifToVideo(gifUrl: string): Promise<{ success: boolean; result: any }> {
  if (!gifUrl) throw new Error("Missing 'url' parameter - provide a GIF URL");
  const { buffer, contentType } = await fetchMediaAsBuffer(gifUrl);
  const mime = detectMime(gifUrl, contentType);
  const base64 = buffer.toString("base64");
  return {
    success: true,
    result: {
      type: "video_data",
      inputFormat: mime,
      outputFormat: "video/mp4",
      base64Data: `data:${mime};base64,${base64}`,
      conversionCommand: "ffmpeg -i input.gif -movflags faststart -pix_fmt yuv420p -vf 'scale=trunc(iw/2)*2:trunc(ih/2)*2' output.mp4",
      instructions: "1. Decode base64 to get the GIF file. 2. Convert to MP4 using ffmpeg. 3. Send as video message.",
      originalUrl: gifUrl,
      size: buffer.length,
    },
  };
}
