import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronRight, Plus, BookOpen, Video as VideoIcon, Lock } from 'lucide-react';
import PlaylistCard from '../components/ui/PlaylistCard';
import { playlistApi } from '../api/playlistApi';
import type { Playlist } from '../types';

export default function MyCoursesPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    playlistApi.getMyPlaylists()
      .then(setPlaylists)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Separate private vs shared playlists for UX sections
  const myPlaylists = playlists.filter((p) => !p.isPrivate);
  const privatePlaylists = playlists.filter((p) => p.isPrivate);

  // Hero — show the first available playlist to continue
  const heroPlaylist = playlists[0];

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-wp-on-surface-variant">Loading learning paths...</div>;
  }

  return (
    <div className="space-y-10 animate-slide-up">

      {/* ── Hero Banner ── */}
      {heroPlaylist && (
        <section className="relative rounded-wp-xl overflow-hidden h-[260px] group cursor-pointer">
          {/* Gradient background (since Playlist has no thumbnailUrl) */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-800 via-purple-800 to-wp-surface" />
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(99,102,241,0.6) 0%, transparent 70%)' }} />

          <div className="absolute inset-0 flex items-center p-8">
            <div className="max-w-lg space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-wp-tertiary flex items-center gap-1">
                <BookOpen size={12} /> Learning Path
              </span>
              <h2 className="text-3xl font-black text-wp-on-surface">{heroPlaylist.name}</h2>
              <p className="text-sm text-wp-on-surface-variant">
                {heroPlaylist._count?.items ?? 0} videos in this playlist
              </p>
              <div className="flex items-center gap-3 pt-1">
                <Link
                  to={`/playlists/${heroPlaylist.id}`}
                  className="btn-primary inline-flex items-center gap-2 text-sm"
                >
                  <Play size={14} className="fill-current" /> Start Learning
                </Link>
                <Link
                  to="/playlists"
                  className="text-sm text-wp-on-surface-variant hover:text-wp-on-surface transition-colors"
                >
                  Browse all →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Shared Playlists ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-wp-on-surface flex items-center gap-2">
              <VideoIcon size={18} className="text-wp-primary" />
              Shared Playlists
            </h2>
            <p className="text-xs text-wp-on-surface-variant mt-0.5">
              Curated learning paths from your organisation
            </p>
          </div>
          <Link
            to="/playlists/new"
            className="flex items-center gap-1.5 text-sm font-medium text-wp-primary
              hover:text-wp-primary-fixed transition-colors"
          >
            <Plus size={16} /> New Playlist
          </Link>
        </div>

        {myPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {myPlaylists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} progress={35} />
            ))}
          </div>
        ) : (
          <EmptyState label="No shared playlists yet." />
        )}
      </section>

      {/* ── Private Playlists ── */}
      {privatePlaylists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-wp-on-surface flex items-center gap-2">
              <Lock size={18} className="text-wp-outline" />
              My Private Playlists
            </h2>
            <Link
              to="/playlists"
              className="text-sm text-wp-primary hover:text-wp-primary-fixed flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {privatePlaylists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-wp-on-surface-variant
      bg-wp-surface-container-low rounded-wp-xl border border-dashed border-wp-outline/30">
      <BookOpen size={40} className="mb-3 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
