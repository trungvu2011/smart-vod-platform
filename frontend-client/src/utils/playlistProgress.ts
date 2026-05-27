import type { HistoryItem, Playlist, Video } from "../types";

export interface PlaylistProgressSummary {
  progress: number;
  completedCount: number;
  activeVideoIndex: number;
  videos: Video[];
}

export function getPlaylistVideos(playlist: Playlist): Video[] {
  return (playlist.items || [])
    .slice()
    .sort((firstItem, secondItem) => firstItem.order - secondItem.order)
    .map((item) => item.video)
    .filter((video): video is Video => Boolean(video));
}

export function getPlaylistProgress(
  playlist: Playlist,
  history: HistoryItem[],
): PlaylistProgressSummary {
  const videos = getPlaylistVideos(playlist);
  let completedCount = 0;

  for (const video of videos) {
    const historyItem = history.find((item) => item.videoId === video.id);
    const duration = video.metadata?.duration ?? 0;
    const isCompleted = historyItem && duration > 0
      ? historyItem.lastSecond / duration >= 0.95
      : false;

    if (!isCompleted) {
      break;
    }

    completedCount += 1;
  }

  const progress = videos.length > 0
    ? Math.round((completedCount / videos.length) * 100)
    : 0;

  return {
    progress,
    completedCount,
    activeVideoIndex: completedCount < videos.length ? completedCount : 0,
    videos,
  };
}
