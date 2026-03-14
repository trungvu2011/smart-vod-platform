import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PlaySquare, Users, Video, Clock, MoreVertical, Search } from "lucide-react";
import { cn } from "../lib/utils";

const MOCK_VIDEOS = Array.from({ length: 12 }).map((_, i) => ({
  id: `video-${i}`,
  title: `React Tutorial for Beginners - Part ${i + 1}`,
  thumbnail: `https://picsum.photos/seed/channelthumb${i}/640/360`,
  views: `${Math.floor(Math.random() * 900) + 10}K`,
  timestamp: `${Math.floor(Math.random() * 11) + 1} months ago`,
  duration: `${Math.floor(Math.random() * 20) + 5}:${Math.floor(Math.random() * 50) + 10}`,
}));

export function Channel() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Videos");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const tabs = ["Home", "Videos", "Shorts", "Live", "Playlists", "Community", "Channels", "About"];

  return (
    <div className="flex flex-col gap-6">
      {/* Channel Banner */}
      <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-surface-dark sm:h-64 lg:h-80">
        <img src={`https://picsum.photos/seed/${id}banner/1920/1080`} alt="Banner" className="h-full w-full object-cover" />
      </div>

      {/* Channel Info */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-8">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface-dark sm:h-32 sm:w-32 border-4 border-bg-dark">
            <img src={`https://picsum.photos/seed/${id}avatar/200/200`} alt="Avatar" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-white sm:text-4xl">{id === 'me' ? 'Your Channel' : 'Alex Streamer'}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <span className="font-medium text-white">@alexstreamer</span>
              <span>•</span>
              <span>1.2M subscribers</span>
              <span>•</span>
              <span>450 videos</span>
            </div>
            <p className="text-sm text-text-secondary line-clamp-2 max-w-2xl">
              Welcome to my channel! I create tutorials on web development, focusing on React, TypeScript, and modern CSS frameworks like Tailwind. Subscribe for weekly content!
            </p>
            <div className="flex items-center gap-4 mt-2">
              {id === 'me' ? (
                <>
                  <Link to="/studio" className="rounded-full bg-surface-dark px-4 py-2 text-sm font-medium text-white hover:bg-neutral-dark transition-colors">
                    Customize Channel
                  </Link>
                  <Link to="/studio" className="rounded-full bg-surface-dark px-4 py-2 text-sm font-medium text-white hover:bg-neutral-dark transition-colors">
                    Manage Videos
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsSubscribed(!isSubscribed)}
                    className={cn(
                      "rounded-full px-6 py-2 text-sm font-medium transition-colors",
                      isSubscribed
                        ? "bg-surface-dark text-white hover:bg-neutral-dark"
                        : "bg-white text-black hover:bg-gray-200"
                    )}
                  >
                    {isSubscribed ? "Subscribed" : "Subscribe"}
                  </button>
                  <button className="rounded-full bg-surface-dark px-4 py-2 text-sm font-medium text-white hover:bg-neutral-dark transition-colors">
                    Join
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-surface-dark px-4 sm:px-8 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors",
              activeTab === tab
                ? "border-white text-white"
                : "border-transparent text-text-secondary hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
        <div className="flex-1" />
        <button className="p-2 text-text-secondary hover:text-white transition-colors">
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="px-4 sm:px-8">
        {activeTab === "Videos" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <button className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-black transition-colors">
                Latest
              </button>
              <button className="rounded-lg bg-surface-dark px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-dark transition-colors">
                Popular
              </button>
              <button className="rounded-lg bg-surface-dark px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-dark transition-colors">
                Oldest
              </button>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {MOCK_VIDEOS.map((video) => (
                <div key={video.id} className="flex flex-col gap-3 group">
                  <Link to={`/watch/${video.id}`} className="relative aspect-video overflow-hidden rounded-xl bg-surface-dark">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                      {video.duration}
                    </div>
                  </Link>
                  <div className="flex gap-3 pr-6 relative">
                    <div className="flex flex-col overflow-hidden">
                      <Link to={`/watch/${video.id}`} className="line-clamp-2 text-sm font-medium text-white group-hover:text-primary transition-colors">
                        {video.title}
                      </Link>
                      <div className="flex items-center text-xs text-text-secondary mt-1">
                        <span>{video.views} views</span>
                        <span className="mx-1">•</span>
                        <span>{video.timestamp}</span>
                      </div>
                    </div>
                    <button className="absolute right-0 top-0 p-1 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-white transition-all">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab !== "Videos" && (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-surface-dark">
            <p className="text-text-secondary">Content for {activeTab} will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
