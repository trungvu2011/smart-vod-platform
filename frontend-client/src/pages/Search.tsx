import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, MoreVertical } from "lucide-react";

const MOCK_RESULTS = Array.from({ length: 10 }).map((_, i) => ({
  id: `result-${i}`,
  title: `Advanced React Patterns and Best Practices - Full Course ${i + 1}`,
  thumbnail: `https://picsum.photos/seed/search${i}/640/360`,
  channel: {
    name: `Tech Channel ${i}`,
    avatar: `https://picsum.photos/seed/user${i}/100/100`,
  },
  views: `${Math.floor(Math.random() * 900) + 10}K`,
  timestamp: `${Math.floor(Math.random() * 11) + 1} months ago`,
  duration: `${Math.floor(Math.random() * 20) + 5}:${Math.floor(Math.random() * 50) + 10}`,
  description: "Learn advanced React patterns including Higher-Order Components, Render Props, Custom Hooks, and Context API. This comprehensive course covers everything you need to know to build scalable and maintainable React applications.",
}));

export function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-surface-dark pb-4">
        <h1 className="text-xl font-bold text-white">Search results for "{query}"</h1>
        <button className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white hover:bg-surface-dark transition-colors">
          <SlidersHorizontal className="h-5 w-5" />
          <span>Filters</span>
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {MOCK_RESULTS.map((video) => (
          <div key={video.id} className="flex flex-col sm:flex-row gap-4 group">
            <Link to={`/watch/${video.id}`} className="relative aspect-video w-full sm:w-80 shrink-0 overflow-hidden rounded-xl bg-surface-dark">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                {video.duration}
              </div>
            </Link>
            <div className="flex flex-col flex-1 py-1 relative pr-8">
              <Link to={`/watch/${video.id}`} className="text-lg font-medium text-white group-hover:text-primary transition-colors line-clamp-2">
                {video.title}
              </Link>
              <div className="flex items-center text-xs text-text-secondary mt-1">
                <span>{video.views} views</span>
                <span className="mx-1">•</span>
                <span>{video.timestamp}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Link to={`/channel/${video.channel.name}`} className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-surface-dark">
                  <img src={video.channel.avatar} alt={video.channel.name} className="h-full w-full object-cover" />
                </Link>
                <Link to={`/channel/${video.channel.name}`} className="text-xs text-text-secondary hover:text-white transition-colors">
                  {video.channel.name}
                </Link>
              </div>
              <p className="text-xs text-text-secondary mt-3 line-clamp-2 hidden sm:block">
                {video.description}
              </p>
              <button className="absolute right-0 top-1 p-1 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-white transition-all">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
