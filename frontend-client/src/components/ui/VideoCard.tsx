import { Link } from 'react-router-dom';
import { Clock, Eye } from 'lucide-react';
import type { Video } from '../../types';

interface VideoCardProps {
  video: Video;
  size?: 'sm' | 'md' | 'lg';
  showChannel?: boolean;
  progress?: number;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
}

export default function VideoCard({ video, size = 'md', showChannel = true, progress }: VideoCardProps) {
  const sizeClasses = {
    sm: 'max-w-[200px]',
    md: 'max-w-[320px]',
    lg: 'max-w-full',
  };

  return (
    <Link
      to={`/watch/${video.id}`}
      className={`block group ${sizeClasses[size]}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-wp-lg overflow-hidden bg-wp-surface-lowest mb-3">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-medium
          bg-black/70 text-white rounded backdrop-blur-sm">
          {formatDuration(video.duration)}
        </span>
        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-wp-surface-container-high">
            <div
              className="h-full bg-wp-primary-container transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-wp-primary-container/10 opacity-0 
          group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      {/* Info */}
      <div className="flex gap-3">
        {showChannel && (
          <img
            src={video.channel.avatar}
            alt={video.channel.name}
            className="w-9 h-9 rounded-full bg-wp-surface-container-high flex-shrink-0 mt-0.5"
          />
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-wp-on-surface leading-snug line-clamp-2
            group-hover:text-wp-primary transition-colors">
            {video.title}
          </h3>
          {showChannel && (
            <p className="text-xs text-wp-on-surface-variant mt-1">
              {video.channel.name}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-wp-outline">
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {formatViews(video.views)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {timeAgo(video.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
