import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Play, Globe, Users } from 'lucide-react';
import PlaylistCard from '../components/ui/PlaylistCard';
import { playlistApi } from '../api/playlistApi';
import type { Playlist } from '../types';

const FILTERS = ['All', 'Newest', 'Most Videos'];

export default function CourseLibraryPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Debounce search input 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await playlistApi.getPublicPlaylists(page, 12, debouncedQ || undefined);
      setPlaylists(data.playlists);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Client-side sort only (no extra API call needed for basic sort)
  const sorted = [...playlists].sort((a, b) => {
    if (activeFilter === 'Most Videos') return (b._count?.items ?? 0) - (a._count?.items ?? 0);
    return 0; // 'All' and 'Newest' — already sorted by backend (createdAt desc)
  });

  return (
    <div className="space-y-10 animate-slide-up">
      {/* ── Header ── */}
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={16} className="text-wp-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-wp-primary">Community Playlists</span>
            </div>
            <h1 className="text-5xl font-black text-wp-on-surface tracking-tighter leading-none">
              Course Library
            </h1>
            <p className="text-wp-on-surface-variant text-base mt-3 leading-relaxed opacity-80">
              Explore curated learning paths created by your colleagues and community.
            </p>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="glass ghost-border px-4 py-2.5 rounded-xl flex items-center gap-2">
                <Users size={14} className="text-wp-primary" />
                <span className="text-sm font-bold text-wp-on-surface">{total}</span>
                <span className="text-xs text-wp-on-surface-variant">playlists</span>
              </div>
            </div>
          )}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-wp-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playlists by name..."
              className="w-full pl-10 pr-4 py-2.5 bg-wp-surface-container-high border border-wp-outline/20 rounded-xl text-sm text-wp-on-surface placeholder-wp-outline focus:outline-none focus:ring-1 focus:ring-wp-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeFilter === f
                    ? 'bg-wp-primary/10 text-wp-primary border border-wp-primary/30'
                    : 'glass ghost-border text-wp-on-surface-variant hover:bg-wp-surface-container-high'
                }`}
              >
                {f}
              </button>
            ))}
            <button className="p-2.5 glass ghost-border rounded-xl text-wp-on-surface-variant hover:bg-wp-surface-container-high transition-colors">
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-wp-surface-container-low rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-wp-surface-container-high" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-wp-surface-container-high rounded w-3/4" />
                <div className="h-3 bg-wp-surface-container-high rounded w-1/2" />
                <div className="h-8 bg-wp-surface-container-high rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sorted.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-lg glass ghost-border text-sm font-medium text-wp-on-surface-variant disabled:opacity-30 hover:bg-wp-surface-container-high transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm text-wp-on-surface-variant">
                Page {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg glass ghost-border text-sm font-medium text-wp-on-surface-variant disabled:opacity-30 hover:bg-wp-surface-container-high transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-wp-surface-container-high rounded-2xl flex items-center justify-center mb-4">
            <Globe size={28} className="text-wp-outline" />
          </div>
          <p className="font-bold text-wp-on-surface mb-1">No public playlists found</p>
          <p className="text-sm text-wp-on-surface-variant max-w-sm">
            {debouncedQ ? `No results for "${debouncedQ}". Try a different keyword.` : 'Be the first to create a public playlist!'}
          </p>
        </div>
      )}

      {/* ── Featured Masterclass promo ── */}
      {!loading && sorted.length > 0 && (
        <section className="glass ghost-border rounded-[2rem] p-10 flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative">
          <div className="lg:w-1/2 z-10 space-y-5">
            <span className="text-wp-primary font-bold uppercase tracking-[0.3em] text-xs">
              Premium Masterclass
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-wp-on-surface leading-none tracking-tighter">
              The Future of <br />
              <span className="text-wp-primary-container">Quantum Computing</span>
            </h2>
            <p className="text-wp-on-surface-variant leading-relaxed opacity-70">
              A comprehensive 24-part series diving into the architectural shift of modern computing.
            </p>
            <button className="px-8 py-4 bg-wp-gradient rounded-xl text-wp-on-primary font-black shadow-[0px_16px_32px_rgba(0,82,255,0.25)] hover:scale-105 active:scale-95 transition-all">
              Unlock Masterclass
            </button>
          </div>

          <div className="lg:w-1/2 relative">
            <div className="absolute -inset-10 bg-wp-primary-container/20 blur-[80px] rounded-full" />
            <div className="relative rounded-2xl overflow-hidden ghost-border shadow-wp-ambient rotate-3 hover:rotate-0 transition-transform duration-700">
              <img
                src="https://picsum.photos/seed/quantumfuture/800/450"
                alt="Quantum Computing Masterclass"
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-wp-surface-lowest/40 backdrop-blur-sm cursor-pointer">
                <div className="w-16 h-16 bg-white text-wp-surface rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                  <Play size={24} className="fill-current ml-1" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
