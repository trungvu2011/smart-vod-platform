import { useParams, Link } from 'react-router-dom';
import { Play, Award, Subtitles, Infinity, BookOpen, Video as VideoIcon } from 'lucide-react';
import { playlists, discoveryVideos, recentUploads } from '../data/mockData';
import type { Video } from '../types';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Find playlist by id, fall back to first
  const playlist = playlists.find((p) => p.id === id) ?? playlists[0];

  // Use videos as "lessons" (in real app these come from playlist items API)
  const videos: Video[] = [...discoveryVideos, ...recentUploads].slice(0, playlist._count?.items ?? 4);
  const totalDuration = videos.reduce((acc, v) => acc + (v.metadata?.duration ?? 0), 0);

  // Mock progress (in real app: computed from watch history)
  const progress = 35;
  const completedCount = Math.round((progress / 100) * videos.length);

  return (
    <div className="animate-slide-up -mx-6 lg:-mx-8 -mt-6 lg:-mt-8">
      {/* ── Hero Section ── */}
      <section className="relative w-full h-[520px] lg:h-[580px] flex items-end overflow-hidden">
        {/* Gradient background (Playlist has no thumbnail) */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-wp-surface">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 60%, rgba(99,102,241,0.5) 0%, transparent 60%)' }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-wp-surface via-wp-surface/40 to-transparent" />

        <div className="relative z-10 px-8 lg:px-12 pb-14 w-full max-w-5xl">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 bg-wp-primary/10 border border-wp-primary/20 text-wp-primary
              text-[10px] font-bold uppercase tracking-[0.15em] rounded-full flex items-center gap-1">
              <BookOpen size={10} /> Playlist
            </span>
            <span className="text-wp-on-surface-variant/60 text-xs">
              • {videos.length} Videos
            </span>
            <span className="text-wp-on-surface-variant/60 text-xs">
              • {formatDuration(totalDuration)} total
            </span>
            {playlist.isPrivate && (
              <span className="text-wp-on-surface-variant/60 text-xs">• Private</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-8 leading-[0.95] text-wp-on-surface">
            {playlist.name.split(' ').slice(0, -2).join(' ')}{' '}
            <br />
            <span className="text-wp-primary">
              {playlist.name.split(' ').slice(-2).join(' ')}
            </span>
          </h1>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Link
              to={`/playlists/${playlist.id}/play`}
              className="bg-wp-gradient px-10 py-4 rounded-xl font-bold text-wp-on-primary
                shadow-2xl hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              <Play size={18} className="fill-current" />
              {progress > 0 ? 'Continue Learning' : 'Start Playlist'}
            </Link>
            <button className="bg-wp-surface-container-high px-8 py-4 rounded-xl font-bold text-wp-on-surface
              hover:bg-wp-surface-bright transition-colors ghost-border">
              View Resources
            </button>
          </div>
        </div>
      </section>

      {/* ── Content Grid ── */}
      <section className="px-8 lg:px-12 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl">
        {/* Video list (Main Column) */}
        <div className="lg:col-span-8">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-wp-on-surface">Playlist Videos</h2>
            <div className="flex items-center gap-4 text-xs font-semibold text-wp-on-surface-variant/50">
              <span>{videos.length} videos</span>
              <span>•</span>
              <span>{formatDuration(totalDuration)} total</span>
            </div>
          </div>

          <div className="space-y-4">
            {videos.map((video, idx) => {
              const isCompleted = idx < completedCount;
              const isActive = idx === completedCount;
              const num = String(idx + 1).padStart(2, '0');
              const dur = video.metadata?.duration ?? 0;

              return (
                <Link
                  key={video.id}
                  to={`/playlists/${playlist.id}/play?v=${video.id}`}
                  className={`group flex items-center gap-6 p-5 rounded-2xl transition-all cursor-pointer relative overflow-hidden
                    ${isActive
                      ? 'bg-wp-surface-bright border border-wp-primary/30 shadow-xl shadow-wp-primary/5'
                      : 'bg-wp-surface-container-low hover:bg-wp-surface-container'
                    }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-wp-primary" />}

                  {/* Thumbnail */}
                  <div className="relative w-24 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={video.thumbnailUrl || `https://picsum.photos/seed/${video.id}/200/112`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-wp-primary/20 flex items-center justify-center">
                        <Play size={16} className="text-white fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-bold tracking-[0.15em] uppercase mb-1 block
                      ${isActive || isCompleted ? 'text-wp-primary' : 'text-wp-on-surface-variant/40'}`}>
                      Video {num}
                    </span>
                    <h3 className="text-base font-bold text-wp-on-surface line-clamp-1">{video.title}</h3>
                    <p className="text-xs text-wp-on-surface-variant mt-0.5">{video.creator.fullName}</p>
                  </div>

                  {/* Duration + status */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-wp-on-surface-variant flex items-center gap-1">
                      <VideoIcon size={12} />{formatDuration(dur)}
                    </p>
                    {isCompleted && (
                      <p className="text-[10px] text-wp-primary font-bold mt-0.5">DONE</p>
                    )}
                    {isActive && (
                      <p className="text-[10px] text-wp-on-surface-variant/40 font-bold uppercase mt-0.5">Playing</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar (Secondary Column) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Progress */}
          <div className="glass ghost-border p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-wp-on-surface opacity-[0.04]">
              <Award size={80} />
            </div>
            <h4 className="text-xs font-bold text-wp-on-surface-variant/60 uppercase tracking-[0.15em] mb-4">
              Your Progress
            </h4>
            <div className="text-4xl font-black text-wp-on-surface mb-2">{progress}%</div>
            <div className="w-full bg-wp-surface-container h-1.5 rounded-full mb-6">
              <div
                className="bg-wp-primary h-full rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-wp-on-surface-variant leading-relaxed">
              You've completed {completedCount} of {videos.length} videos.
              Keep going to earn your{' '}
              <span className="text-wp-primary font-bold">Professional Certification</span>.
            </p>
          </div>

          {/* Feature list */}
          <div className="px-2 space-y-4">
            <div className="flex items-center gap-4">
              <Award size={20} className="text-wp-primary flex-shrink-0" />
              <span className="text-sm font-medium text-wp-on-surface">Certificate of Completion</span>
            </div>
            <div className="flex items-center gap-4">
              <Subtitles size={20} className="text-wp-primary flex-shrink-0" />
              <span className="text-sm font-medium text-wp-on-surface">Subtitles in 12 languages</span>
            </div>
            <div className="flex items-center gap-4">
              <Infinity size={20} className="text-wp-primary flex-shrink-0" />
              <span className="text-sm font-medium text-wp-on-surface">Lifetime access to all updates</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
