import { useState, useEffect } from 'react';
import {
   BookOpen, Award, TrendingUp, CheckCircle,
  Medal, Play, Mail,
  Building2, MapPin, Pencil, ArrowRight, Lock, Users,
  Video
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuthStore } from '../store/useAuthStore';
import { playlistApi } from '../api/playlistApi';
import type { Playlist } from '../types';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      playlistApi.getMyPlaylists()
        .then(setPlaylists)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-12 animate-slide-up">
      {/* ── Profile Header Hero ── */}
      <section className="flex flex-col lg:flex-row items-end lg:items-center justify-between gap-8 pb-12"
        style={{ borderBottom: '1px solid rgba(67, 70, 86, 0.1)' }}>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full">
          {/* Avatar with gradient glow */}
          <div className="relative group flex-shrink-0">
            <div className="absolute -inset-1 bg-wp-gradient rounded-full opacity-25 blur-sm transition duration-700 group-hover:opacity-50" />
            <img
              src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.fullName}
              alt={user.fullName}
              className="relative w-40 h-40 lg:w-48 lg:h-48 rounded-full object-cover
                border-4 border-wp-surface shadow-wp-ambient"
            />
          </div>

          {/* Info */}
          <div className="space-y-2 text-center md:text-left flex-1">
            <h1 className="text-5xl font-black tracking-tighter text-wp-on-surface">
              {user.fullName}
            </h1>
            <p className="text-xl text-wp-primary font-medium">{user.title}</p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-wp-surface-container-high rounded-full">
                <Mail size={14} className="text-wp-tertiary" />
                <span className="text-xs font-semibold text-wp-on-surface-variant">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-wp-surface-container-high rounded-full">
                <Building2 size={14} className="text-wp-tertiary" />
                <span className="text-xs font-semibold text-wp-on-surface-variant">{user.department || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-wp-surface-container-high rounded-full">
                <MapPin size={14} className="text-wp-tertiary" />
                <span className="text-xs font-semibold text-wp-on-surface-variant">Remote</span>
              </div>
            </div>
          </div>
        </div>

        <Link to="/settings" className="bg-wp-surface-container-high hover:bg-wp-surface-bright text-wp-on-surface
          px-8 py-3 rounded-wp-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap
          active:scale-95">
          <Pencil size={16} />
          Edit Profile
        </Link>
      </section>

      {/* ── Stats Grid (Bento Style) ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: 'Videos Viewed',
            value: (user.videosViewed ?? 0).toLocaleString(),
            trend: '+12% this month',
            trendIcon: <TrendingUp size={14} />,
            watermark: <Play size={80} />,
          },
          {
            label: 'Playlists Created',
            value: loading ? '-' : playlists.length.toLocaleString(), 
            trend: 'Keep it going',
            trendIcon: <CheckCircle size={14} />,
            watermark: <BookOpen size={80} />,
          },
          {
            label: 'Certifications',
            value: (user.certifications ?? 0).toString().padStart(2, '0'),
            trend: '3 pending review',
            trendIcon: <Medal size={14} />,
            watermark: <Award size={80} />,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-wp-surface-container-low p-8 rounded-3xl relative overflow-hidden group"
          >
            {/* Watermark icon */}
            <div className="absolute -right-4 -bottom-4 text-wp-on-surface opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
              {stat.watermark}
            </div>

            <p className="text-wp-on-surface-variant text-[11px] font-bold uppercase tracking-[0.15em] mb-1">
              {stat.label}
            </p>
            <p className="text-6xl font-black text-wp-on-surface tracking-tighter">
              {stat.value}
            </p>
            <div className="mt-4 flex items-center gap-2 text-wp-tertiary text-xs font-bold">
              {stat.trendIcon}
              {stat.trend}
            </div>
          </div>
        ))}
      </section>

      {/* ── Main Layout ── */}
      <div className="space-y-8">
        {/* Curated Playlists */}
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-wp-on-surface">
                Curated Playlists
              </h2>
              <p className="text-wp-on-surface-variant/60">Your private and shared collections</p>
            </div>
            <Link to="/playlists" className="text-wp-primary hover:text-wp-primary-fixed transition-colors text-sm font-bold
              flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-wp-on-surface-variant text-sm col-span-full">Loading playlists...</p>
            ) : playlists.length === 0 ? (
              <p className="text-wp-on-surface-variant text-sm col-span-full">You haven't created any learning paths yet.</p>
            ) : (
              playlists.slice(0, 3).map((pl) => (
                <Link key={pl.id} to={`/playlists/${pl.id}`} className="group relative aspect-video rounded-3xl overflow-hidden cursor-pointer block">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-800 via-purple-800 to-wp-surface" />
                  <div className="absolute inset-0 bg-gradient-to-t from-wp-surface/90 via-wp-surface/40 to-transparent z-10" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end z-20">
                    <div className="glass rounded-2xl p-4 ghost-border">
                      <h3 className="text-xl font-bold text-wp-on-surface line-clamp-1">{pl.name}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-wp-on-surface-variant flex items-center gap-1">
                          <Video size={13} /> {pl._count?.items ?? 0} Videos
                        </span>
                        <span className="text-xs text-wp-on-surface-variant flex items-center gap-1">
                          {pl.isPrivate ? <Lock size={13} /> : <Users size={13} />}
                          {pl.isPrivate ? 'Private' : 'Shared'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
