import { useState, useEffect } from "react";
import { X, Plus, Check, Search, Lock, Globe } from "lucide-react";
import { playlistApi } from "../../api/playlistApi";
import type { Playlist } from "../../types";

interface AddToPlaylistModalProps {
  videoId: string;
  onClose: () => void;
  onCreateNewClick: () => void;
}

export default function AddToPlaylistModal({ videoId, onClose, onCreateNewClick }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const data = await playlistApi.getMyPlaylists();
      setPlaylists(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (playlist: Playlist) => {
    const isAdded = playlist.items?.some((i) => i.videoId === videoId);
    
    setSavingIds((prev) => new Set(prev).add(playlist.id));
    
    try {
      if (isAdded) {
        await playlistApi.removeVideo(playlist.id, videoId);
        // Update local state optimistic
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlist.id
              ? { ...p, items: p.items?.filter((i) => i.videoId !== videoId) }
              : p
          )
        );
      } else {
        await playlistApi.addVideo(playlist.id, videoId);
        // Update local state optimistic
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlist.id
              ? { ...p, items: [...(p.items || []), { videoId, playlistId: p.id, order: 0, addedAt: "" }] }
              : p
          )
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(playlist.id);
        return next;
      });
    }
  };

  const filteredPlaylists = playlists.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-wp-surface-highest/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-wp-surface-container-low border border-wp-outline/20 rounded-wp-xl w-full max-w-sm overflow-hidden shadow-wp-ambient animate-slide-up flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wp-outline/10">
          <h2 className="text-lg font-semibold text-wp-on-surface">Save to Playlist</h2>
          <button
            onClick={onClose}
            className="p-1 text-wp-on-surface-variant hover:text-wp-on-surface hover:bg-wp-surface-container-high rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-wp-outline/10">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wp-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playlists..."
              className="w-full pl-9 pr-3 py-2 bg-wp-surface-container-high rounded-lg text-sm text-wp-on-surface placeholder-wp-outline focus:outline-none focus:ring-1 focus:ring-wp-primary"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-center text-wp-on-surface-variant text-sm animate-pulse">
              Loading playlists...
            </div>
          ) : filteredPlaylists.length > 0 ? (
            filteredPlaylists.map((pl) => {
              const isAdded = pl.items?.some((i) => i.videoId === videoId);
              const isSaving = savingIds.has(pl.id);

              return (
                <button
                  key={pl.id}
                  onClick={() => handleToggle(pl)}
                  disabled={isSaving}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-wp-surface-container-high transition-colors text-left"
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                    isAdded 
                      ? "bg-wp-primary border-wp-primary text-wp-on-primary" 
                      : "border-wp-outline text-transparent"
                  }`}>
                    {isSaving ? (
                       <span className="w-2.5 h-2.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    ) : (
                       <Check size={14} className={isAdded ? "block" : "hidden"} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-wp-on-surface truncate line-clamp-1">{pl.name}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-wp-on-surface-variant">
                       {pl.isPrivate ? <Lock size={10} /> : <Globe size={10} />}
                       <span>{pl.isPrivate ? "Private" : "Shared"}</span>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-wp-on-surface-variant text-sm">
              No playlists found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-wp-outline/10 bg-wp-surface-container-highest">
          <button
            onClick={() => {
              onClose();
              onCreateNewClick();
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 text-sm font-medium text-wp-primary hover:bg-wp-primary/10 rounded-lg transition-colors"
          >
            <Plus size={16} /> Create New Playlist
          </button>
        </div>
      </div>
    </div>
  );
}
