import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Video, BarChart2, MessageSquare, Settings, Upload, Edit3, Trash2, Eye, ThumbsUp, MessageCircle } from "lucide-react";
import { cn } from "../lib/utils";

const MOCK_VIDEOS = Array.from({ length: 5 }).map((_, i) => ({
  id: `video-${i}`,
  title: `React Tutorial for Beginners - Part ${i + 1}`,
  thumbnail: `https://picsum.photos/seed/studio${i}/320/180`,
  visibility: i % 2 === 0 ? "Public" : "Private",
  date: "Oct 24, 2023",
  views: Math.floor(Math.random() * 10000),
  comments: Math.floor(Math.random() * 500),
  likes: Math.floor(Math.random() * 2000),
}));

export function CreatorStudio() {
  const [activeTab, setActiveTab] = useState("Content");

  const sidebarLinks = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Video, label: "Content" },
    { icon: BarChart2, label: "Analytics" },
    { icon: MessageSquare, label: "Comments" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-surface-dark pb-4">
        <h1 className="text-2xl font-bold text-white">Channel content</h1>
        <Link to="/studio/upload" className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors">
          <Upload className="h-4 w-4" />
          <span>Upload Video</span>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Studio Sidebar */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          {sidebarLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => setActiveTab(link.label)}
              className={cn(
                "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                activeTab === link.label
                  ? "bg-surface-dark text-primary"
                  : "text-text-secondary hover:bg-surface-dark hover:text-text-primary"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6">
          {activeTab === "Content" && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 border-b border-surface-dark pb-4">
                <button className="text-sm font-medium text-white border-b-2 border-white pb-4 -mb-[17px]">Videos</button>
                <button className="text-sm font-medium text-text-secondary hover:text-white transition-colors pb-4 -mb-[17px]">Live</button>
                <button className="text-sm font-medium text-text-secondary hover:text-white transition-colors pb-4 -mb-[17px]">Playlists</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-text-secondary">
                  <thead className="border-b border-surface-dark text-xs uppercase text-text-secondary">
                    <tr>
                      <th className="px-4 py-3 font-medium">Video</th>
                      <th className="px-4 py-3 font-medium">Visibility</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Views</th>
                      <th className="px-4 py-3 font-medium">Comments</th>
                      <th className="px-4 py-3 font-medium">Likes</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_VIDEOS.map((video) => (
                      <tr key={video.id} className="border-b border-surface-dark hover:bg-surface-dark/50 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-28 shrink-0 overflow-hidden rounded bg-surface-dark relative">
                              <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Edit3 className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-white line-clamp-1">{video.title}</span>
                              <span className="text-xs text-text-secondary mt-1">Add description</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            video.visibility === "Public" ? "bg-emerald-500/10 text-emerald-500" : "bg-surface-dark text-text-secondary"
                          )}>
                            {video.visibility}
                          </span>
                        </td>
                        <td className="px-4 py-4">{video.date}</td>
                        <td className="px-4 py-4">{video.views.toLocaleString()}</td>
                        <td className="px-4 py-4">{video.comments.toLocaleString()}</td>
                        <td className="px-4 py-4">{video.likes.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-text-secondary hover:text-white hover:bg-neutral-dark rounded transition-colors">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-text-secondary hover:text-white hover:bg-neutral-dark rounded transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === "Dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-surface-dark bg-surface-dark/30 p-6 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-text-secondary mb-2">
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">Total Views</span>
                </div>
                <span className="text-3xl font-bold text-white">1.2M</span>
                <span className="text-sm text-emerald-500">+12% from last month</span>
              </div>
              <div className="rounded-2xl border border-surface-dark bg-surface-dark/30 p-6 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-text-secondary mb-2">
                  <ThumbsUp className="h-5 w-5" />
                  <span className="font-medium">Total Likes</span>
                </div>
                <span className="text-3xl font-bold text-white">45.2K</span>
                <span className="text-sm text-emerald-500">+5% from last month</span>
              </div>
              <div className="rounded-2xl border border-surface-dark bg-surface-dark/30 p-6 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-text-secondary mb-2">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">Total Comments</span>
                </div>
                <span className="text-3xl font-bold text-white">12.4K</span>
                <span className="text-sm text-text-secondary">-2% from last month</span>
              </div>
            </div>
          )}

          {activeTab !== "Content" && activeTab !== "Dashboard" && (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-surface-dark">
              <p className="text-text-secondary">{activeTab} features coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
