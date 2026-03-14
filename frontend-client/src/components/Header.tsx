import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Video, Menu, User, LogOut, Settings } from "lucide-react";
import React, { useState } from "react";

export function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-surface-dark bg-bg-dark px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-full p-2 text-text-secondary hover:bg-surface-dark hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
            <Video className="h-5 w-5 text-white" />
          </div>
          <span className="hidden text-xl font-bold tracking-tight text-white sm:block">
            StreamFlow
          </span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 lg:px-12">
        <form
          onSubmit={handleSearch}
          className="flex w-full max-w-2xl items-center overflow-hidden rounded-full border border-surface-dark bg-surface-dark/50 focus-within:border-primary/50 focus-within:bg-bg-dark"
        >
          <input
            type="text"
            placeholder="Search videos, channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-6 py-2.5 text-sm text-text-primary placeholder-text-secondary focus:outline-none"
          />
          <button
            type="submit"
            className="flex h-full items-center justify-center bg-surface-dark px-6 py-2.5 text-text-secondary hover:bg-neutral-dark hover:text-text-primary transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          to="/studio/upload"
          className="hidden items-center gap-2 rounded-full bg-surface-dark px-4 py-2 text-sm font-medium text-text-primary hover:bg-neutral-dark sm:flex transition-colors"
        >
          <Video className="h-4 w-4" />
          <span>Create</span>
        </Link>
        <button className="rounded-full p-2 text-text-secondary hover:bg-surface-dark hover:text-text-primary transition-colors">
          <Bell className="h-6 w-6" />
        </button>
        
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-surface-dark hover:ring-2 hover:ring-primary transition-all"
          >
            <img src="https://picsum.photos/seed/myprofile/100/100" alt="Profile" className="h-full w-full object-cover" />
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-surface-dark bg-bg-dark py-2 shadow-xl shadow-black/50">
              <div className="flex items-center gap-3 border-b border-surface-dark px-4 pb-3 pt-2">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-surface-dark">
                  <img src="https://picsum.photos/seed/myprofile/100/100" alt="Profile" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">Alex Streamer</span>
                  <span className="text-xs text-text-secondary">@alexstreamer</span>
                </div>
              </div>
              <div className="flex flex-col py-2">
                <Link to="/channel/me" className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
                  <User className="h-4 w-4" />
                  Your Channel
                </Link>
                <Link to="/studio" className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
                  <Video className="h-4 w-4" />
                  Creator Studio
                </Link>
                <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-dark hover:text-white transition-colors">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>
              <div className="border-t border-surface-dark py-2">
                <Link to="/signin" className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-dark hover:text-primary transition-colors">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
