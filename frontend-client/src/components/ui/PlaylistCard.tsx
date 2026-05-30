import { Link } from 'react-router-dom';
import { BookOpen, Play, Lock, Video } from 'lucide-react';
import type { Playlist } from '../../types';

interface PlaylistCardProps {
  playlist: Playlist;
  /** Approximate progress 0-100 derived from watch history (optional) */
  progress?: number;
}

function formatCount(n?: number): string {
  if (!n) return '0 videos';
  return `${n} video${n !== 1 ? 's' : ''}`;
}

function fallbackThumbnail(playlistId: string): string {
  return `https://img.youtube.com/vi/70j3UJO-_uY/hqdefault.jpg#${playlistId}`;
}

export default function PlaylistCard({ playlist, progress }: PlaylistCardProps) {
  const itemCount = playlist._count?.items ?? playlist.items?.length ?? 0;
  const hasProgress = progress !== undefined && progress > 0;
  const isCompleted = (progress ?? 0) >= 100;
  const coverImage = playlist.coverThumbnailUrl || playlist.items?.find((item) => item.video?.thumbnailUrl)?.video?.thumbnailUrl;

  const ctaLabel = isCompleted
    ? 'Review Playlist'
    : hasProgress
      ? progress! >= 80 ? 'Almost Done' : 'Continue'
      : 'Start';

  // Deterministic gradient per playlist id for a nice visual fallback
  const gradients = [
    'from-indigo-600 to-purple-700',
    'from-cyan-600 to-blue-700',
    'from-emerald-600 to-teal-700',
    'from-orange-500 to-pink-600',
  ];
  const idx = playlist.id.charCodeAt(playlist.id.length - 1) % gradients.length;
  const gradient = gradients[idx];

  return (
    <Link
      to={`/playlists/${playlist.id}`}
      className="group bg-wp-surface-container-low rounded-xl overflow-hidden
        hover:scale-[1.02] transition-all duration-300 flex flex-col h-full shadow-lg"
    >
      {/* Cover / thumbnail */}
      <div className={`relative aspect-video ${coverImage ? 'bg-wp-surface-container-high' : `bg-gradient-to-br ${gradient}`} overflow-hidden flex items-center justify-center`}>
        {coverImage ? (
          <>
            <img
              src={coverImage || fallbackThumbnail(playlist.id)}
              alt={playlist.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(event) => {
                const img = event.currentTarget;
                if (img.src !== fallbackThumbnail(playlist.id)) {
                  img.src = fallbackThumbnail(playlist.id);
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          </>
        ) : (
          <BookOpen size={48} className="text-white/30 group-hover:scale-110 transition-transform duration-500" />
        )}

        {/* Private badge */}
        {playlist.isPrivate && (
          <div className="absolute top-3 left-3 flex items-center gap-1 glass ghost-border
            px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-wp-on-surface">
            <Lock size={10} /> Private
          </div>
        )}

        {/* Video count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm
          px-2 py-1 rounded text-xs font-medium text-white">
          <Video size={12} />
          {formatCount(itemCount)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-base font-bold leading-tight text-wp-on-surface mb-3
          group-hover:text-wp-primary transition-colors line-clamp-2">
          {playlist.name}
        </h3>

        {/* Progress + CTA */}
        <div className="mt-auto space-y-3">
          {hasProgress && (
            <div>
              <div className="flex justify-between text-[11px] font-bold text-wp-on-surface-variant
                uppercase tracking-wider mb-1.5">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-wp-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-wp-primary-container rounded-full"
                  style={{ width: `${progress}%`, boxShadow: '0 0 8px rgba(0,82,255,0.4)' }}
                />
              </div>
            </div>
          )}

          <button
            className={`w-full py-2.5 rounded-lg font-bold text-sm tracking-wide
              active:scale-95 transition-all flex items-center justify-center gap-2 ${
                hasProgress
                  ? 'bg-wp-gradient text-wp-on-primary'
                  : 'bg-wp-surface-container-high text-wp-on-surface hover:bg-wp-surface-bright'
              }`}
          >
            <Play size={13} className={hasProgress ? 'fill-current' : ''} />
            {ctaLabel}
          </button>
        </div>
      </div>
    </Link>
  );
}
