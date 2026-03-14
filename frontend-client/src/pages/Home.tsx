import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";

const MOCK_VIDEOS = Array.from({ length: 12 }).map((_, i) => ({
  id: `video-${i}`,
  title: `Building a Modern Web Application with React and Tailwind CSS - Part ${i + 1}`,
  thumbnail: `https://picsum.photos/seed/thumb${i}/640/360`,
  channel: {
    name: `Tech Channel ${i}`,
    avatar: `https://picsum.photos/seed/user${i}/100/100`,
  },
  views: `${Math.floor(Math.random() * 900) + 10}K`,
  timestamp: `${Math.floor(Math.random() * 11) + 1} months ago`,
  duration: `${Math.floor(Math.random() * 20) + 5}:${Math.floor(Math.random() * 50) + 10}`,
}));

export function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {["All", "Gaming", "Music", "Live", "Mixes", "Programming", "Podcasts", "News", "Recently uploaded", "Watched"].map((category, i) => (
          <button
            key={category}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              i === 0
                ? "bg-white text-black"
                : "bg-surface-dark text-white hover:bg-neutral-dark"
            }`}
          >
            {category}
          </button>
        ))}
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
              <Link to={`/channel/${video.channel.name}`} className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-dark">
                <img src={video.channel.avatar} alt={video.channel.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-col overflow-hidden">
                <Link to={`/watch/${video.id}`} className="line-clamp-2 text-sm font-medium text-white group-hover:text-primary transition-colors">
                  {video.title}
                </Link>
                <Link to={`/channel/${video.channel.name}`} className="mt-1 text-xs text-text-secondary hover:text-white transition-colors">
                  {video.channel.name}
                </Link>
                <div className="flex items-center text-xs text-text-secondary">
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
  );
}
