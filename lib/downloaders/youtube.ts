import { getDownloadInfo, extractVideoId } from "../scraper";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface YouTubeMedia {
  type: string;
  quality: string;
  format: string;
  fileSize: string;
  downloadUrl: string;
}

interface YouTubeResult {
  success: boolean;
  creator?: string;
  title?: string;
  thumbnail?: string;
  videoId?: string;
  media?: YouTubeMedia[];
  error?: string;
}

export async function downloadYouTube(url: string): Promise<YouTubeResult> {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      return { success: false, error: "Invalid YouTube URL." };
    }

    const [mp3Result, mp4Result] = await Promise.all([
      getDownloadInfo(url, "mp3"),
      getDownloadInfo(url, "mp4"),
    ]);

    const media: YouTubeMedia[] = [];

    if (mp3Result.success && mp3Result.downloadUrl) {
      media.push({
        type: "Audio",
        quality: "192kbps",
        format: "MP3",
        fileSize: "~3-5 MB",
        downloadUrl: mp3Result.downloadUrl,
      });
    }

    if (mp4Result.success && mp4Result.downloadUrl) {
      media.push({
        type: "Video",
        quality: "360p",
        format: "MP4",
        fileSize: "~10-30 MB",
        downloadUrl: mp4Result.downloadUrl,
      });
    }

    const title = mp3Result.title || mp4Result.title || "YouTube Video";

    return {
      success: true,
      creator: "Megan APIs by Tracker Wanga | Falcon Tech",
      title,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      videoId,
      media: media.length > 0 ? media : undefined,
    };
  } catch (error: any) {
    return { success: false, error: `YouTube download failed: ${error.message}` };
  }
}
