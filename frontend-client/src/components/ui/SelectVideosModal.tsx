import { useState, useEffect } from "react";
import { X, Search, Check, PlayCircle } from "lucide-react";
import { videoApi } from "../../api/videoApi";
import { playlistApi } from "../../api/playlistApi";
import type { Video, Playlist } from "../../types";

interface SelectVideosModalProps {
  playlist: Playlist;
  onClose: () => void;
  onUpdated: () => void;
}

export default function SelectVideosModal({ playlist, onClose, onUpdated }: SelectVideosModalProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // Tracks the optimistic state of whether a video is in the playlist
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize selected state from the existing playlist items
    const initialSelected = new Set(playlist.items?.map((item) => item.videoId) || []);
    setSelectedVideoIds(initialSelected);

    // Fetch all available READY videos to choose from
    const fetchAllVideos = async () => {
      try {
        const data = await videoApi.getVideos(1, 100, undefined, "READY");
        setVideos(data.videos || []);
      } catch (err) {
        console.error("Failed to load videos", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllVideos();
  }, [playlist]);

  const handleToggle = async (video: Video) => {
    const isAdded = selectedVideoIds.has(video.id);

    setSavingIds((prev) => new Set(prev).add(video.id));

    try {
      if (isAdded) {
        await playlistApi.removeVideo(playlist.id, video.id);
        setSelectedVideoIds((prev) => {
           const next = new Set(prev);
           next.delete(video.id);
           return next;
        });
      } else {
        await playlistApi.addVideo(playlist.id, video.id);
        setSelectedVideoIds((prev) => new Set(prev).add(video.id));
      }
      // Trigger a light callback to owner component so it knows things changed
      onUpdated();
    } catch (error) {
      console.error(error);
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(video.id);
        return next;
      });
    }
  };

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.creator.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-wp-surface-highest/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-wp-surface-container-low border border-wp-outline/20 rounded-wp-xl w-full max-w-lg overflow-hidden shadow-wp-ambient animate-slide-up flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wp-outline/10">
          <div>
             <h2 className="text-lg font-semibold text-wp-on-surface">Manage Videos</h2>
             <p className="text-xs text-wp-on-surface-variant font-medium">Add or remove videos from <span className="text-wp-primary">"{playlist.name}"</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-wp-on-surface-variant hover:text-wp-on-surface hover:bg-wp-surface-container-high rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-wp-outline/10">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wp-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library for videos or creators..."
              className="w-full pl-9 pr-3 py-2.5 bg-wp-surface-container-high rounded-lg text-sm text-wp-on-surface placeholder-wp-outline focus:outline-none focus:ring-1 focus:ring-wp-primary"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-wp-on-surface-variant text-sm animate-pulse space-y-4">
              {[...Array(4)].map((_, i) => (
                 <div key={i} className="flex gap-4 p-2 items-center">
                    <div className="w-5 h-5 rounded bg-wp-surface-container-high shrink-0"></div>
                    <div className="w-24 h-14 rounded bg-wp-surface-container-high shrink-0"></div>
                    <div className="flex-1 space-y-2">
                       <div className="h-4 bg-wp-surface-container-high w-3/4 rounded"></div>
                       <div className="h-3 bg-wp-surface-container-high w-1/2 rounded"></div>
                    </div>
                 </div>
              ))}
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="space-y-1">
              {filteredVideos.map((video) => {
                const isAdded = selectedVideoIds.has(video.id);
                const isSaving = savingIds.has(video.id);

                return (
                  <button
                    key={video.id}
                    onClick={() => handleToggle(video)}
                    disabled={isSaving}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-wp-surface-container-high transition-colors text-left group"
                  >
                    {/* Checkbox Element */}
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                      isAdded 
                        ? "bg-wp-primary border-wp-primary text-wp-on-primary shadow-wp-glow shadow-wp-primary/30" 
                        : "border-wp-outline/40 text-transparent"
                    }`}>
                      {isSaving ? (
                        <span className="w-2.5 h-2.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check size={14} className={isAdded ? "block" : "hidden"} />
                      )}
                    </div>
                    
                    {/* Thumb */}
                    <div className="w-20 aspect-video bg-wp-surface-bright rounded border border-wp-outline/10 shrink-0 relative overflow-hidden">
                       <img 
                          src={video.thumbnailUrl || `https://picsum.photos/seed/${video.id}/160/90`} 
                          alt="Thumb" 
                          className="w-full h-full object-cover" 
                       />
                       {isAdded && (
                          <div className="absolute inset-0 bg-wp-primary/30 flex items-center justify-center">
                             <PlayCircle size={16} className="text-white fill-current" />
                          </div>
                       )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate line-clamp-1 transition-colors ${isAdded ? "text-wp-primary" : "text-wp-on-surface"}`}>
                        {video.title}
                      </p>
                      <p className="text-xs text-wp-on-surface-variant flex items-center gap-1.5 mt-1">
                         {video.creator.fullName} • {Math.floor((video.metadata?.duration || 0) / 60)}m
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
               <div className="w-12 h-12 bg-wp-surface-container-high rounded-full flex items-center justify-center mb-3">
                  <Search size={20} className="text-wp-outline" />
               </div>
               <p className="text-sm font-medium text-wp-on-surface">No videos found.</p>
               <p className="text-xs text-wp-on-surface-variant mt-1 max-w-[200px]">
                 Try searching for different keywords or check your spelling.
               </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-wp-outline/10 bg-wp-surface-container-highest flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-wp-primary text-wp-on-primary text-sm font-bold rounded-lg hover:bg-wp-primary-fixed transition-colors shadow-lg shadow-wp-primary/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
