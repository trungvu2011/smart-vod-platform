import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, Plus, BookOpen, Lock, Globe,
  GraduationCap, Video as VideoIcon
} from 'lucide-react';
import PlaylistCard from '../components/ui/PlaylistCard';
import CreatePlaylistModal from '../components/ui/CreatePlaylistModal';
import { playlistApi } from '../api/playlistApi';
import { useAuthStore } from '../store/useAuthStore';
import type { Playlist } from '../types';

export default function MyCoursesPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchPlaylists = () => {
    setLoading(true);
    playlistApi.getMyPlaylists()
      .then(setPlaylists)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  // ── Playlists I created ────────────────────────────────────────────────────
  const myCreated = playlists; // getMyPlaylists already returns only mine

  // Separate created → public vs private
  const publicPlaylists = myCreated.filter((p) => !p.isPrivate);
  const privatePlaylists = myCreated.filter((p) => p.isPrivate);

  // ── "In-progress" simulation: playlists with at least 1 video ─────────────
  // In a real app this would come from a WatchHistory API.
  // For now we highlight playlists that have items, showing a mock progress.
  const inProgress = myCreated.filter((p) => (p._count?.items ?? 0) > 0).slice(0, 4);

  const heroPlaylist = myCreated[0];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-[200px] bg-wp-surface-container-low rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-wp-surface-container-low rounded-xl overflow-hidden">
              <div className="aspect-video bg-wp-surface-container-high" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-wp-surface-container-high rounded w-3/4" />
                <div className="h-8 bg-wp-surface-container-high rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-slide-up">

      {/* ── Hero Banner ── */}
      {heroPlaylist ? (
        <section className="relative rounded-wp-xl overflow-hidden h-[240px] group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-800 via-purple-900 to-wp-surface" />
          <div
            className="absolute inset-0 opacity-25"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(99,102,241,0.6) 0%, transparent 70%)' }}
          />

          <div className="absolute inset-0 flex items-center p-8 lg:p-10">
            <div className="max-w-lg space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-wp-tertiary flex items-center gap-1.5">
                <GraduationCap size={12} /> My Learning
              </span>
              <h2 className="text-3xl font-black text-wp-on-surface leading-tight">{heroPlaylist.name}</h2>
              <p className="text-sm text-wp-on-surface-variant">
                {heroPlaylist._count?.items ?? 0} videos · {heroPlaylist.isPrivate ? 'Private' : 'Public'}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <Link
                  to={`/playlists/${heroPlaylist.id}`}
                  className="flex items-center gap-2 px-5 py-2.5 bg-wp-gradient text-wp-on-primary font-bold rounded-xl text-sm shadow-lg shadow-wp-primary/20 hover:scale-105 transition-transform"
                >
                  <Play size={14} className="fill-current" /> Open Playlist
                </Link>
                <Link
                  to="/playlists"
                  className="text-sm text-wp-on-surface-variant hover:text-wp-on-surface transition-colors"
                >
                  Browse Library →
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Empty hero — no playlists at all */
        <section className="relative rounded-wp-xl overflow-hidden border border-dashed border-wp-outline/20">
          <div className="p-12 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-wp-surface-container-high rounded-2xl flex items-center justify-center">
              <BookOpen size={28} className="text-wp-outline" />
            </div>
            <div>
              <p className="font-bold text-wp-on-surface mb-1">No playlists yet</p>
              <p className="text-sm text-wp-on-surface-variant mb-5">
                Create your first playlist to start curating your learning journey.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-wp-gradient text-wp-on-primary font-bold rounded-xl text-sm shadow-lg shadow-wp-primary/20 hover:scale-105 transition-transform"
              >
                <Plus size={16} /> Create Playlist
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── In Progress ── */}
      {inProgress.length > 0 && (
        <section>
          <SectionHeader
            icon={<Play size={18} className="fill-current text-wp-tertiary" />}
            title="Continue Learning"
            subtitle="Playlists you've started — pick up where you left off"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-5">
            {inProgress.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} progress={35} />
            ))}
          </div>
        </section>
      )}

      {/* ── My Public Playlists ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <SectionHeader
            icon={<Globe size={18} className="text-wp-primary" />}
            title="My Public Playlists"
            subtitle="Playlists you've shared with your organisation"
            inline
          />
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-wp-primary bg-wp-primary/10 hover:bg-wp-primary/20 border border-wp-primary/20 rounded-xl transition-colors"
          >
            <Plus size={15} /> New Playlist
          </button>
        </div>

        {publicPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {publicPlaylists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} progress={35} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Globe size={36} className="text-wp-outline opacity-50" />}
            label="You haven't created any public playlists yet."
            action={
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-wp-primary bg-wp-primary/10 hover:bg-wp-primary/20 border border-wp-primary/20 rounded-xl transition-colors"
              >
                <Plus size={14} /> Create one now
              </button>
            }
          />
        )}
      </section>

      {/* ── My Private Playlists ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <SectionHeader
            icon={<Lock size={18} className="text-wp-outline" />}
            title="My Private Playlists"
            subtitle="Only you can see these"
            inline
          />
        </div>

        {privatePlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {privatePlaylists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Lock size={36} className="text-wp-outline opacity-50" />}
            label="No private playlists. Create one to organize content just for yourself."
          />
        )}
      </section>

      {/* ── Stats footer ── */}
      {myCreated.length > 0 && (
        <div className="glass ghost-border rounded-2xl p-6 grid grid-cols-3 divide-x divide-wp-outline/10">
          <Stat label="Total Playlists" value={myCreated.length} icon={<BookOpen size={18} />} />
          <Stat
            label="Total Videos"
            value={myCreated.reduce((acc, p) => acc + (p._count?.items ?? 0), 0)}
            icon={<VideoIcon size={18} />}
          />
          <Stat label="Public" value={publicPlaylists.length} icon={<Globe size={18} />} />
        </div>
      )}

      {/* ── Create Modal ── */}
      {isCreateOpen && (
        <CreatePlaylistModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={fetchPlaylists}
        />
      )}
    </div>
  );
}

/* ── Helper Sub-components ──────────────────────────────────────────────────── */
function SectionHeader({
  icon, title, subtitle, inline = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-wp-on-surface flex items-center gap-2">
          {icon} {title}
        </h2>
        <p className="text-xs text-wp-on-surface-variant mt-0.5">{subtitle}</p>
      </div>
    );
  }
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-wp-on-surface flex items-center gap-2">
        {icon} {title}
      </h2>
      <p className="text-xs text-wp-on-surface-variant mt-0.5">{subtitle}</p>
    </div>
  );
}

function EmptyState({
  icon, label, action,
}: {
  icon: React.ReactNode;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-wp-on-surface-variant bg-wp-surface-container-low rounded-2xl border border-dashed border-wp-outline/20 gap-3">
      {icon}
      <p className="text-sm text-center max-w-xs">{label}</p>
      {action}
    </div>
  );
}

function Stat({
  label, value, icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4">
      <div className="flex items-center gap-1.5 text-wp-primary mb-1">{icon}</div>
      <span className="text-2xl font-black text-wp-on-surface">{value}</span>
      <span className="text-xs text-wp-on-surface-variant text-center">{label}</span>
    </div>
  );
}
