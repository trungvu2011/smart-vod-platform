import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Clock, Eye, Trash2, SlidersHorizontal } from 'lucide-react';
import { discoveryVideos, recentUploads, upNextVideos } from '../data/mockData';
import type { Video } from '../types';

// Mock liked videos — combine various sources
const likedVideos: (Video & { likedAt: string })[] = [
  { ...discoveryVideos[0], likedAt: '2024-10-28T17:00:00Z' },
  { ...upNextVideos[0], likedAt: '2024-10-27T12:30:00Z' },
  { ...discoveryVideos[1], likedAt: '2024-10-26T09:15:00Z' },
  { ...recentUploads[2], likedAt: '2024-10-25T20:00:00Z' },
  { ...discoveryVideos[3], likedAt: '2024-10-24T14:45:00Z' },
  { ...recentUploads[0], likedAt: '2024-10-23T11:00:00Z' },
  { ...upNextVideos[1], likedAt: '2024-10-22T08:30:00Z' },
  { ...recentUploads[3], likedAt: '2024-10-21T16:20:00Z' },
];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

type SortOption = 'recent' | 'oldest' | 'most_viewed';

export default function LikedVideosPage() {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sorted = [...likedVideos].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime();
    if (sortBy === 'oldest') return new Date(a.likedAt).getTime() - new Date(b.likedAt).getTime();
    return b.views - a.views;
  });

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-wp-on-surface tracking-tight flex items-center gap-2">
            <Heart size={24} className="text-red-400 fill-red-400" />
            Liked Videos
          </h1>
          <p className="text-sm text-wp-on-surface-variant mt-1">
            {likedVideos.length} videos you've appreciated
          </p>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-wp-outline" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-wp-surface-container text-sm text-wp-on-surface rounded-wp px-3 py-2
              focus:outline-none focus:shadow-wp-glow cursor-pointer"
          >
            <option value="recent">Recently Liked</option>
            <option value="oldest">Oldest First</option>
            <option value="most_viewed">Most Viewed</option>
          </select>
        </div>
      </div>

      {/* Video list */}
      <div className="space-y-2">
        {sorted.map((video, index) => (
          <Link
            key={`${video.id}-${index}`}
            to={`/watch/${video.id}`}
            className="flex items-center gap-5 p-4 rounded-wp-lg
              hover:bg-wp-surface-container-high/50 transition-all duration-200 group"
            onMouseEnter={() => setHoveredId(video.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Index / Heart */}
            <div className="w-8 text-center flex-shrink-0">
              {hoveredId === video.id ? (
                <Heart size={18} className="text-red-400 fill-red-400 mx-auto" />
              ) : (
                <span className="text-sm text-wp-outline tabular-nums">{index + 1}</span>
              )}
            </div>

            {/* Thumbnail */}
            <div className="relative w-56 aspect-video rounded-wp overflow-hidden flex-shrink-0">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-xs font-medium
                bg-black/70 text-white rounded">
                {formatDuration(video.duration)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 py-2">
              <h3 className="text-base font-semibold text-wp-on-surface group-hover:text-wp-primary
                transition-colors line-clamp-1">
                {video.title}
              </h3>
              <p className="text-sm text-wp-on-surface-variant mt-1.5">
                {video.channel.name}
              </p>
              <div className="flex items-center gap-3 mt-2 text-sm text-wp-outline">
                <span className="flex items-center gap-1">
                  <Eye size={14} />
                  {video.views.toLocaleString()} views
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  Liked {timeAgo(video.likedAt)}
                </span>
              </div>
            </div>

            {/* Remove button (on hover) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: remove from liked
              }}
              className="p-2 rounded-lg opacity-0 group-hover:opacity-100
                hover:bg-wp-surface-bright text-wp-outline hover:text-wp-error
                transition-all duration-200 flex-shrink-0"
              title="Remove from liked"
            >
              <Trash2 size={16} />
            </button>
          </Link>
        ))}
      </div>

      {likedVideos.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <Heart size={48} className="text-wp-outline mx-auto" />
          <p className="text-wp-on-surface-variant">No liked videos yet</p>
          <p className="text-xs text-wp-outline">Videos you like will appear here</p>
        </div>
      )}
    </div>
  );
}
