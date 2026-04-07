import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSidebarStore } from '../../store/useSidebarStore';

export default function MainLayout() {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-wp-surface">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${isCollapsed ? 'ml-[72px]' : 'ml-[240px]'}`}
      >
        <Navbar />
        <main className="p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
