import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronRight, Clock, BookOpen, TrendingUp, Eye } from 'lucide-react';
import VideoCard from '../components/ui/VideoCard';
import PlaylistCard from '../components/ui/PlaylistCard';
import { videoApi } from '../api/videoApi';
import { userApi } from '../api/userApi';
import { playlistApi } from '../api/playlistApi';
import { getPlaylistProgress } from '../utils/playlistProgress';
import type { Video, HistoryItem, Playlist } from '../types';

function formatDuration(seconds: number = 0): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [videosData, historyData, playlistsData] = await Promise.all([
          videoApi.getVideos(1, 12, undefined, 'READY'),
          userApi.getHistory(),
          playlistApi.getMyPlaylists(),
        ]);
        setVideos(videosData.videos);
        setHistory(historyData);
        setPlaylists(playlistsData);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-10 animate-pulse">
        <div className="h-[380px] rounded-wp-xl bg-wp-surface-container-low" />
        <div className="grid grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-wp-surface-container-low" />
          ))}
        </div>
      </div>
    );
  }

  const featuredVideo = videos[0] ?? null;
  const discoveryVideos = videos.slice(1, 5);
  const recentUploads = videos.slice(0, 8);

  // Continue watching — from watch history, videos not fully watched
  const continueWatching = history
    .filter(h => {
      const dur = h.video?.metadata?.duration ?? 0;
      return dur > 0 && h.lastSecond / dur < 0.95;
    })
    .slice(0, 4);

  return (
    <div className="space-y-12 animate-slide-up">

      {/* ── Hero Banner ── */}
      {featuredVideo && (
        <section className="relative rounded-wp-xl overflow-hidden h-[380px] group">
          <img
            src={featuredVideo.thumbnailUrl || 'https://picsum.photos/seed/hero/1200/500'}
            alt={featuredVideo.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wp-surface via-wp-surface/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
            <span className="inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-wide
              bg-wp-primary/20 text-wp-primary rounded-md backdrop-blur-sm">
              {featuredVideo.category ?? 'Featured'}
            </span>
            <h1 className="text-3xl font-bold text-wp-on-surface leading-tight max-w-2xl"
              style={{ letterSpacing: '-0.02em' }}>
              {featuredVideo.title}
            </h1>
            <p className="text-sm text-wp-on-surface-variant max-w-xl leading-relaxed line-clamp-2">
              {featuredVideo.description ?? 'No description provided.'}
            </p>
            <div className="flex items-center gap-3">
              <Link to={`/watch/${featuredVideo.id}`} className="btn-primary inline-flex items-center gap-2">
                <Play size={16} className="fill-current" /> Watch Now
              </Link>
              <span className="text-xs text-wp-outline flex items-center gap-1">
                <Clock size={14} />
                {formatDuration(featuredVideo.metadata?.duration ?? 0)}
              </span>
              <span className="text-xs text-wp-outline flex items-center gap-1">
                <Eye size={14} />
                {featuredVideo.viewCount.toLocaleString()} views
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Continue Watching ── */}
      {continueWatching.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-wp-on-surface flex items-center gap-2">
                <Play size={18} className="text-wp-primary" /> Continue Watching
              </h2>
              <p className="text-sm text-wp-on-surface-variant mt-0.5">Pick up where you left off</p>
            </div>
            <Link to="/history" className="text-sm text-wp-primary hover:text-wp-primary-fixed
              flex items-center gap-1 transition-colors">
              View History <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {continueWatching.map((h) => {
              const dur = h.video.metadata?.duration ?? 0;
              const progress = dur > 0 ? Math.round((h.lastSecond / dur) * 100) : 0;
              return (
                <VideoCard key={h.id} video={h.video} size="lg" progress={progress} />
              );
            })}
          </div>
        </section>
      )}

      {/* ── Discovery Cluster (from real API) ── */}
      {discoveryVideos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-wp-on-surface flex items-center gap-2">
                <TrendingUp size={18} className="text-wp-primary" /> Discovery Cluster
              </h2>
              <p className="text-sm text-wp-on-surface-variant mt-0.5">
                Curated picks for your professional growth
              </p>
            </div>
            <Link to="/trending" className="text-sm text-wp-primary hover:text-wp-primary-fixed
              flex items-center gap-1 transition-colors">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {discoveryVideos.map((video) => (
              <VideoCard key={video.id} video={video} size="lg" />
            ))}
          </div>
        </section>
      )}

      {/* ── My Playlists (Learning Paths) ── */}
      {playlists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-wp-on-surface flex items-center gap-2">
                <BookOpen size={18} className="text-wp-primary" /> My Learning Paths
              </h2>
              <p className="text-sm text-wp-on-surface-variant mt-0.5">
                Your curated playlists &amp; courses
              </p>
            </div>
            <Link to="/my-courses" className="text-sm text-wp-primary hover:text-wp-primary-fixed
              flex items-center gap-1 transition-colors">
              All Playlists <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {playlists.slice(0, 3).map((playlist) => {
              const { progress } = getPlaylistProgress(playlist, history);
              return (
                <PlaylistCard key={playlist.id} playlist={playlist} progress={progress} />
              );
            })}
          </div>
        </section>
      )}

      {/* ── Recent Uploads (from real API) ── */}
      {recentUploads.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-wp-on-surface">Recent Uploads</h2>
            <Link to="/trending" className="text-sm text-wp-primary hover:text-wp-primary-fixed
              flex items-center gap-1 transition-colors">
              See More <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentUploads.map((video) => (
              <Link
                key={video.id}
                to={`/watch/${video.id}`}
                className="group cursor-pointer block"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                  <img
                    src={video.thumbnailUrl || 'https://picsum.photos/seed/' + video.id + '/400/225'}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 bg-wp-surface-container-high"
                  />
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] text-white font-medium">
                    {formatDuration(video.metadata?.duration ?? 0)}
                  </div>
                </div>
                <h4 className="font-bold text-sm text-wp-on-surface leading-snug
                  group-hover:text-wp-primary transition-colors line-clamp-2">
                  {video.title}
                </h4>
                <p className="text-xs text-wp-on-surface-variant mt-1">
                  {video.creator.fullName} • {timeAgo(video.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
