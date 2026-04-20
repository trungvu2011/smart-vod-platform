import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import VideoCard from "../components/ui/VideoCard";
import { videoApi } from "../api/videoApi";
import type { Video } from "../types";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      if (!q.trim()) {
        setVideos([]);
        setTotal(0);
        return;
      }
      
      setLoading(true);
      try {
        const data = await videoApi.getVideos(1, 48, undefined, "READY", q);
        setVideos(data.videos || []);
        setTotal(data.pagination?.total || 0);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [q]);

  if (!q.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-wp-on-surface-variant">
        <Search size={48} className="mb-4 opacity-20" />
        <h2 className="text-xl font-semibold text-wp-on-surface">Please enter a search term.</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up pb-10">
      <div className="mb-6 border-b border-wp-surface-highest pb-4">
        <h1 className="text-xl font-semibold text-wp-on-surface">
          Search results for: <span className="text-wp-primary italic">"{q}"</span>
        </h1>
        {!loading && (
          <p className="text-sm text-wp-on-surface-variant mt-1">
            Found {total} video{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
             <div key={i} className="animate-pulse">
               <div className="w-full aspect-video bg-wp-surface-container-high rounded-wp-lg mb-3" />
               <div className="flex gap-3">
                 <div className="w-9 h-9 rounded-full bg-wp-surface-container-high shrink-0" />
                 <div className="space-y-2 flex-1 pt-1">
                   <div className="h-4 bg-wp-surface-container-high rounded w-3/4" />
                   <div className="h-3 bg-wp-surface-container-high rounded w-1/2" />
                 </div>
               </div>
             </div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} size="lg" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-wp-on-surface-variant 
             bg-wp-surface-container-low rounded-wp-xl border border-dashed border-wp-outline/30">
          <Search size={40} className="mb-3 opacity-30" />
          <p className="text-base text-wp-on-surface">No videos found matching your query.</p>
          <p className="text-sm mt-1">Try using different keywords or checking for typos.</p>
        </div>
      )}
    </div>
  );
}
