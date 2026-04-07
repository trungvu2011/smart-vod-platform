import { Search, Bell, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: navigate to search results
    console.log('Search:', searchQuery);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-wp-surface/80 backdrop-blur-wp flex items-center justify-between px-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative w-full max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wp-outline" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search videos, courses, people..."
          className="w-full pl-10 pr-4 py-2.5 bg-wp-surface-container-low rounded-lg
            text-sm text-wp-on-surface placeholder-wp-outline
            focus:outline-none focus:bg-wp-surface-container-highest focus:shadow-wp-glow
            transition-all duration-200"
        />
      </form>

      {/* Right section */}
      <div className="flex items-center gap-4 ml-6">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-wp-surface-container-high transition-colors">
          <Bell size={20} className="text-wp-on-surface-variant" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-wp-primary-fixed rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg
              hover:bg-wp-surface-container-high transition-colors"
          >
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-8 h-8 rounded-full bg-wp-surface-container-high"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-wp-on-surface leading-tight">{user?.name}</p>
              <p className="text-xs text-wp-on-surface-variant leading-tight">{user?.title}</p>
            </div>
            <ChevronDown size={16} className="text-wp-on-surface-variant hidden md:block" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-12 w-56 py-2 rounded-wp-lg bg-wp-surface-container-high 
                shadow-wp-ambient z-50 animate-fade-in">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-2.5 text-sm text-wp-on-surface hover:bg-wp-surface-bright transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-2.5 text-sm text-wp-on-surface hover:bg-wp-surface-bright transition-colors"
                >
                  Settings
                </Link>
                <hr className="my-1 border-wp-outline-variant/10" />
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                    navigate('/login');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-wp-error hover:bg-wp-surface-bright transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
