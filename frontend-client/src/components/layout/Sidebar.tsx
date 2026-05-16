import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, GraduationCap,
  History, ThumbsUp, ListVideo,
  Settings, ChevronLeft, ChevronRight,
  Play, PlusCircle, Video as VideoIcon, Users, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSidebarStore } from '../../store/useSidebarStore';
import { useAuthStore } from '../../store/useAuthStore';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const discoveryItems: NavItem[] = [
  { to: '/', icon: <Home size={20} />, label: 'Home' },
  { to: '/meetings', icon: <Users size={20} />, label: 'Meetings' },
  { to: '/playlists', icon: <GraduationCap size={20} />, label: 'Course Library' },
];

const personalItems: NavItem[] = [
  { to: '/my-videos', icon: <VideoIcon size={20} />, label: 'My Videos' },
  { to: '/my-courses', icon: <ListVideo size={20} />, label: 'My Playlists' },
  { to: '/history', icon: <History size={20} />, label: 'History' },
  { to: '/liked', icon: <ThumbsUp size={20} />, label: 'Liked Videos' },
];

const footerItems: NavItem[] = [
  { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
];

export default function Sidebar() {
  const { isCollapsed, toggle } = useSidebarStore();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const linkClasses = (path: string) => {
    const isActive = location.pathname === path || 
      (path !== '/' && location.pathname.startsWith(path));
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
      ${isActive
        ? 'bg-wp-surface-container-high text-wp-primary'
        : 'text-wp-on-surface-variant hover:bg-wp-surface-container-high/50 hover:text-wp-on-surface'
      }
      ${isCollapsed ? 'justify-center' : ''}
    `;
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-wp-surface-container-low z-40
        flex flex-col transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[72px]' : 'w-[240px]'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 rounded-lg bg-wp-gradient flex items-center justify-center flex-shrink-0">
          <Play size={16} className="text-wp-on-primary fill-current" />
        </div>
        {!isCollapsed && (
          <span className="text-wp-on-surface font-semibold text-lg tracking-tight">
            WayPoint
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-6">
        {/* Discovery */}
        <div>
          {!isCollapsed && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-wp-outline mb-2 px-3">
              Discovery
            </p>
          )}
          <ul className="space-y-0.5">
            {discoveryItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={linkClasses(item.to)} title={item.label}>
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Personal */}
        <div>
          {!isCollapsed && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-wp-outline mb-2 px-3">
              Personal
            </p>
          )}
          <ul className="space-y-0.5">
            {personalItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={linkClasses(item.to)} title={item.label}>
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer nav */}
      <div className="px-3 pb-3 space-y-2">
        {user?.role === 'ADMIN' && (
          <Link
            to="/admin/dashboard"
            className={`w-full border border-wp-primary/30 bg-wp-primary/10 text-wp-primary font-bold rounded-xl
              active:scale-95 transition-all flex items-center justify-center gap-2
              hover:bg-wp-primary/15 hover:shadow-wp-glow
              ${isCollapsed ? 'p-2.5' : 'py-3 px-3'}
            `}
            title="Admin Dashboard"
          >
            <ShieldCheck size={18} />
            {!isCollapsed && <span className="text-sm">Admin Dashboard</span>}
          </Link>
        )}

        {/* Upload CTA */}
        <Link
          to="/upload"
          className={`w-full bg-wp-gradient text-wp-on-primary font-bold rounded-xl
            shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2
            hover:shadow-wp-glow
            ${isCollapsed ? 'p-2.5' : 'py-3'}
          `}
          title="Upload Video"
        >
          <PlusCircle size={18} />
          {!isCollapsed && <span className="text-sm">Upload</span>}
        </Link>

        {footerItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClasses(item.to)} title={item.label}>
            <span className="flex-shrink-0">{item.icon}</span>
            {!isCollapsed && (
              <span className="text-sm font-medium truncate">{item.label}</span>
            )}
          </NavLink>
        ))}

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full
            text-wp-on-surface-variant hover:bg-wp-surface-container-high/50
            transition-all duration-200"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
