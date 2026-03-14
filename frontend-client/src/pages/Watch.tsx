import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, MessageSquare } from "lucide-react";
import { cn } from "../lib/utils";

const MOCK_RELATED = Array.from({ length: 8 }).map((_, i) => ({
  id: `related-${i}`,
  title: `How to build a scalable backend with Node.js and Express - Part ${i + 1}`,
  thumbnail: `https://picsum.photos/seed/related${i}/320/180`,
  channel: `Tech Channel ${i}`,
  views: `${Math.floor(Math.random() * 900) + 10}K`,
  timestamp: `${Math.floor(Math.random() * 11) + 1} months ago`,
  duration: `${Math.floor(Math.random() * 20) + 5}:${Math.floor(Math.random() * 50) + 10}`,
}));

export function Watch() {
  const { id } = useParams();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Video Player Placeholder */}
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black relative group">
          <img src={`https://picsum.photos/seed/${id}/1280/720`} alt="Video" className="h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/90 flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-primary/50">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-dark group-hover:h-1.5 transition-all">
            <div className="h-full bg-primary w-1/3 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Building a Modern Web Application with React and Tailwind CSS - Complete Guide
          </h1>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link to="/channel/alexstreamer" className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-dark">
                <img src="https://picsum.photos/seed/alexstreamer/100/100" alt="Channel" className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-col">
                <Link to="/channel/alexstreamer" className="font-bold text-white hover:text-primary transition-colors">
                  Alex Streamer
                </Link>
                <span className="text-xs text-text-secondary">1.2M subscribers</span>
              </div>
              <button
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={cn(
                  "ml-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isSubscribed
                    ? "bg-surface-dark text-white hover:bg-neutral-dark"
                    : "bg-white text-black hover:bg-gray-200"
                )}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <div className="flex items-center rounded-full bg-surface-dark">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={cn(
                    "flex items-center gap-2 rounded-l-full px-4 py-2 text-sm font-medium hover:bg-neutral-dark transition-colors border-r border-neutral-dark",
                    isLiked ? "text-primary" : "text-white"
                  )}
                >
                  <ThumbsUp className="h-5 w-5" />
                  <span>24K</span>
                </button>
                <button className="flex items-center gap-2 rounded-r-full px-4 py-2 text-sm font-medium text-white hover:bg-neutral-dark transition-colors">
                  <ThumbsDown className="h-5 w-5" />
                </button>
              </div>
              <button className="flex items-center gap-2 rounded-full bg-surface-dark px-4 py-2 text-sm font-medium text-white hover:bg-neutral-dark transition-colors">
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </button>
              <button className="flex items-center gap-2 rounded-full bg-surface-dark px-4 py-2 text-sm font-medium text-white hover:bg-neutral-dark transition-colors">
                <Download className="h-5 w-5" />
                <span>Download</span>
              </button>
              <button className="flex items-center justify-center rounded-full bg-surface-dark h-9 w-9 text-white hover:bg-neutral-dark transition-colors">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl bg-surface-dark p-4 text-sm text-white">
            <div className="flex gap-2 font-medium mb-2">
              <span>1.2M views</span>
              <span>•</span>
              <span>2 days ago</span>
              <span className="text-text-secondary">#react #tailwindcss #webdev</span>
            </div>
            <p className="text-text-secondary line-clamp-3 hover:line-clamp-none cursor-pointer">
              In this comprehensive tutorial, we'll build a modern web application from scratch using React, TypeScript, and Tailwind CSS. We'll cover everything from setting up the project to deploying it to production.
              <br /><br />
              Timestamps:
              <br />
              0:00 - Introduction
              <br />
              5:20 - Project Setup
              <br />
              15:45 - Building the UI
              <br />
              45:30 - State Management
              <br />
              1:20:00 - Deployment
            </p>
          </div>

          {/* Comments Section */}
          <div className="mt-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white">1,234 Comments</h2>
              <div className="flex items-center gap-2 text-sm font-medium text-text-secondary cursor-pointer hover:text-white transition-colors">
                <MessageSquare className="h-5 w-5" />
                <span>Sort by</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-dark">
                <img src="https://picsum.photos/seed/myprofile/100/100" alt="My Profile" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="w-full border-b border-surface-dark bg-transparent py-1 text-sm text-white placeholder-text-secondary focus:border-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Mock Comments */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-dark">
                  <img src={`https://picsum.photos/seed/commenter${i}/100/100`} alt="Commenter" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white">@user{i}</span>
                    <span className="text-text-secondary">{i} days ago</span>
                  </div>
                  <p className="text-sm text-white">This is an amazing tutorial! Really helped me understand how to structure my React applications better. Thanks for sharing!</p>
                  <div className="flex items-center gap-4 mt-1">
                    <button className="flex items-center gap-1 text-xs text-text-secondary hover:text-white transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{Math.floor(Math.random() * 100)}</span>
                    </button>
                    <button className="flex items-center gap-1 text-xs text-text-secondary hover:text-white transition-colors">
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                    <button className="text-xs font-medium text-text-secondary hover:text-white transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar / Related Videos */}
      <div className="flex w-full flex-col gap-4 lg:w-[400px] shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["All", "From Alex Streamer", "Related", "Recently uploaded"].map((category, i) => (
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

        <div className="flex flex-col gap-3">
          {MOCK_RELATED.map((video) => (
            <div key={video.id} className="flex gap-2 group">
              <Link to={`/watch/${video.id}`} className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-xl bg-surface-dark">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                  {video.duration}
                </div>
              </Link>
              <div className="flex flex-col overflow-hidden py-0.5">
                <Link to={`/watch/${video.id}`} className="line-clamp-2 text-sm font-medium text-white group-hover:text-primary transition-colors">
                  {video.title}
                </Link>
                <Link to={`/channel/${video.channel}`} className="mt-1 text-xs text-text-secondary hover:text-white transition-colors">
                  {video.channel}
                </Link>
                <div className="flex items-center text-xs text-text-secondary mt-0.5">
                  <span>{video.views} views</span>
                  <span className="mx-1">•</span>
                  <span>{video.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
