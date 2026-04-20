import { useState, useEffect } from 'react';
import { SlidersHorizontal, Play } from 'lucide-react';
import PlaylistCard from '../components/ui/PlaylistCard';
import { playlistApi } from '../api/playlistApi';
import type { Playlist } from '../types';

// Derive categories from playlists (future: from API)
const ALL = 'All';

export default function CourseLibraryPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(ALL);

  useEffect(() => {
    playlistApi.getMyPlaylists()
      .then(setPlaylists)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [ALL, ...Array.from(new Set(playlists.map((p) => (p.isPrivate ? 'Private' : 'Shared'))))];

  const filtered = playlists.filter((p) => {
    if (activeCategory === ALL) return true;
    return activeCategory === 'Private' ? p.isPrivate : !p.isPrivate;
  });

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-wp-on-surface-variant">Loading library...</div>;
  }

  return (
    <div className="space-y-12 animate-slide-up">
      {/* Header + Filter pills */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black text-wp-on-surface tracking-tighter mb-4">
            Playlist Library
          </h1>
          <p className="text-wp-on-surface-variant text-lg leading-relaxed opacity-80">
            Curated video playlists and learning paths. Each playlist is your own personal course.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full glass ghost-border text-sm font-medium transition-all duration-200
                ${activeCategory === cat
                  ? 'text-wp-primary border-wp-primary/20 bg-wp-primary/5'
                  : 'text-wp-on-surface-variant hover:bg-wp-surface-container-high'
                }`}
            >
              {cat}
            </button>
          ))}
          <button className="px-3 py-2.5 rounded-full glass ghost-border
            text-wp-on-surface-variant hover:bg-wp-surface-container-high transition-colors">
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </header>

      {/* Playlist grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {filtered.map((pl) => (
          <PlaylistCard key={pl.id} playlist={pl} progress={pl.isPrivate ? undefined : 35} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-wp-on-surface-variant">No playlists match your filter.</p>
        </div>
      )}

      {/* Featured Masterclass promo panel */}
      <section className="glass ghost-border rounded-[2rem] p-12 flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative">
        <div className="lg:w-1/2 z-10 space-y-6">
          <span className="text-wp-primary font-bold uppercase tracking-[0.3em] text-xs">
            Premium Masterclass
          </span>
          <h2 className="text-5xl lg:text-6xl font-black text-wp-on-surface leading-none tracking-tighter">
            The Future of <br />
            <span className="text-wp-primary-container">Quantum Computing</span>
          </h2>
          <p className="text-wp-on-surface-variant text-lg leading-relaxed opacity-70 max-w-lg">
            A comprehensive 24-part series diving into the architectural shift of modern computing.
            Led by industry veterans from WayPoint's core R&amp;D team.
          </p>
          <div className="flex items-center gap-8">
            <button className="px-10 py-5 bg-wp-gradient rounded-xl text-wp-on-primary font-black text-lg
              shadow-[0px_20px_40px_rgba(0,82,255,0.3)]
              hover:scale-105 active:scale-95 transition-all">
              Unlock Masterclass
            </button>
          </div>
        </div>

        <div className="lg:w-1/2 relative">
          <div className="absolute -inset-10 bg-wp-primary-container/20 blur-[100px] rounded-full" />
          <div className="relative rounded-2xl overflow-hidden ghost-border shadow-wp-ambient
            rotate-3 hover:rotate-0 transition-transform duration-700">
            <img
              src="https://picsum.photos/seed/quantumfuture/800/450"
              alt="Quantum Computing Masterclass"
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-wp-surface-lowest/40 backdrop-blur-sm cursor-pointer">
              <div className="w-20 h-20 bg-white text-wp-surface rounded-full flex items-center justify-center
                shadow-2xl hover:scale-110 transition-transform">
                <Play size={32} className="fill-current ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
