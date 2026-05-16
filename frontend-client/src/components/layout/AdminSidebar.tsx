import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminSidebar() {
  const { logout } = useAuthStore();

  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { name: 'User Management', path: '/admin/users', icon: 'group' },
    { name: 'Content Moderation', path: '/admin/moderation', icon: 'gavel' },
    { name: 'Analytics', path: '/admin/analytics', icon: 'analytics' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-40 bg-wp-surface-container-low flex flex-col py-6 px-4 space-y-2 shadow-wp-ambient pt-20">
      <div className="px-4 mb-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-wp-outline font-bold">Enterprise Admin</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? 'bg-wp-surface-container-high text-wp-primary font-bold'
                  : 'text-wp-outline hover:text-wp-on-surface hover:bg-wp-surface-container-high/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span 
                  className="material-symbols-outlined" 
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {link.icon}
                </span>
                {link.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 space-y-1 border-t border-wp-outline-variant/10">
        <Link to="/" className="flex items-center gap-3 px-4 py-3 text-wp-primary hover:text-wp-primary-fixed hover:bg-wp-primary/10 transition-all rounded-lg text-sm font-bold">
          <span className="material-symbols-outlined">switch_account</span>
          User Dashboard
        </Link>
        <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-3 px-4 py-3 text-wp-outline hover:text-wp-on-surface hover:bg-wp-surface-container-high/50 transition-all rounded-lg text-sm font-medium">
          <span className="material-symbols-outlined">help</span>
          Support
        </a>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-wp-outline hover:text-wp-error hover:bg-wp-error-container/10 transition-all rounded-lg text-sm font-medium">
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
