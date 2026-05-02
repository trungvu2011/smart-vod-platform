import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminLayout() {

  const { user } = useAuthStore();

  return (
    <div className="bg-wp-surface text-wp-on-surface font-sans antialiased min-h-screen">
      <AdminNavbar />
      <AdminSidebar />
      <main className="pl-64 pt-16 min-h-screen">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
