import { Link } from "react-router-dom";
import { Search, Trash2, Clock } from "lucide-react";

const MOCK_HISTORY = Array.from({ length: 8 }).map((_, i) => ({
  id: `history-${i}`,
  title: `Building a Modern Web Application with React and Tailwind CSS - Part ${i + 1}`,
  thumbnail: `https://picsum.photos/seed/history${i}/320/180`,
  channel: `Tech Channel ${i}`,
  views: `${Math.floor(Math.random() * 900) + 10}K`,
  timestamp: `${Math.floor(Math.random() * 11) + 1} months ago`,
  duration: `${Math.floor(Math.random() * 20) + 5}:${Math.floor(Math.random() * 50) + 10}`,
  watchedPercentage: Math.floor(Math.random() * 100),
}));

export function History() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-white">Watch History</h1>

        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold text-white mt-4 border-b border-surface-dark pb-2">Today</h2>
          {MOCK_HISTORY.slice(0, 3).map((video) => (
            <div key={video.id} className="flex flex-col sm:flex-row gap-4 group">
              <Link to={`/watch/${video.id}`} className="relative aspect-video w-full sm:w-64 shrink-0 overflow-hidden rounded-xl bg-surface-dark">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                  {video.duration}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-dark">
                  <div className="h-full bg-primary" style={{ width: `${video.watchedPercentage}%` }}></div>
                </div>
              </Link>
              <div className="flex flex-col flex-1 py-1 relative pr-8">
                <Link to={`/watch/${video.id}`} className="text-lg font-medium text-white group-hover:text-primary transition-colors line-clamp-2">
                  {video.title}
                </Link>
                <div className="flex items-center text-xs text-text-secondary mt-1">
                  <Link to={`/channel/${video.channel}`} className="hover:text-white transition-colors">
                    {video.channel}
                  </Link>
                  <span className="mx-1">•</span>
                  <span>{video.views} views</span>
                </div>
                <p className="text-xs text-text-secondary mt-3 line-clamp-2 hidden sm:block">
                  In this comprehensive tutorial, we'll build a modern web application from scratch using React, TypeScript, and Tailwind CSS.
                </p>
                <button className="absolute right-0 top-1 p-2 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-white hover:bg-surface-dark rounded-full transition-all">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}

          <h2 className="text-lg font-semibold text-white mt-8 border-b border-surface-dark pb-2">Yesterday</h2>
          {MOCK_HISTORY.slice(3, 8).map((video) => (
            <div key={video.id} className="flex flex-col sm:flex-row gap-4 group">
              <Link to={`/watch/${video.id}`} className="relative aspect-video w-full sm:w-64 shrink-0 overflow-hidden rounded-xl bg-surface-dark">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                  {video.duration}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-dark">
                  <div className="h-full bg-primary" style={{ width: `${video.watchedPercentage}%` }}></div>
                </div>
              </Link>
              <div className="flex flex-col flex-1 py-1 relative pr-8">
                <Link to={`/watch/${video.id}`} className="text-lg font-medium text-white group-hover:text-primary transition-colors line-clamp-2">
                  {video.title}
                </Link>
                <div className="flex items-center text-xs text-text-secondary mt-1">
                  <Link to={`/channel/${video.channel}`} className="hover:text-white transition-colors">
                    {video.channel}
                  </Link>
                  <span className="mx-1">•</span>
                  <span>{video.views} views</span>
                </div>
                <p className="text-xs text-text-secondary mt-3 line-clamp-2 hidden sm:block">
                  In this comprehensive tutorial, we'll build a modern web application from scratch using React, TypeScript, and Tailwind CSS.
                </p>
                <button className="absolute right-0 top-1 p-2 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-white hover:bg-surface-dark rounded-full transition-all">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-surface-dark pb-4">
          <Search className="h-5 w-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search watch history"
            className="w-full bg-transparent text-sm text-white placeholder-text-secondary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2 border-b border-surface-dark pb-4">
          <button className="flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
            <Trash2 className="h-5 w-5" />
            Clear all watch history
          </button>
          <button className="flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
            <Clock className="h-5 w-5" />
            Pause watch history
          </button>
        </div>
      </div>
    </div>
  );
}
