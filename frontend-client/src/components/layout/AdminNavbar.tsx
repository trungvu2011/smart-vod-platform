import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import UserAvatar from '../ui/UserAvatar';

export default function AdminNavbar() {
  const { user } = useAuthStore();

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-wp-surface shadow-md font-sans">
      <div className="flex items-center gap-8">
        <Link to="/admin/dashboard" className="text-xl font-bold tracking-tighter text-wp-on-surface">
          WayPoint
        </Link>
        <div className="hidden md:flex items-center gap-6 ml-4">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wp-outline text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search content..." 
              className="bg-wp-surface-lowest border-none rounded-lg pl-10 pr-4 py-1.5 text-sm w-64 focus:ring-1 focus:ring-wp-primary/20 focus:bg-wp-surface-container-high transition-all text-wp-on-surface"
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-wp-outline hover:text-wp-on-surface transition-all p-2 rounded-full hover:bg-wp-surface-container-high active:scale-95">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-wp-outline hover:text-wp-on-surface transition-all p-2 rounded-full hover:bg-wp-surface-container-high active:scale-95">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="h-8 w-px bg-wp-outline-variant/20 mx-2"></div>
        <button className="bg-gradient-to-br from-wp-primary to-wp-primary-container text-wp-on-primary px-5 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-wp-primary/10">
          Upload
        </button>
        <UserAvatar
          src={user?.avatarUrl}
          name={user?.fullName}
          alt="Admin profile"
          className="w-9 h-9 border-2 border-wp-surface-container-high ml-2 cursor-pointer"
          initialClassName="text-xs"
        />
      </div>
    </nav>
  );
}
