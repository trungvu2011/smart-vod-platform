import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import WatchVideoPage from "./pages/WatchVideoPage";
import SettingsPage from "./pages/SettingsPage";
import CourseLibraryPage from "./pages/CourseLibraryPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursePlayerPage from "./pages/CoursePlayerPage";
import HistoryPage from "./pages/HistoryPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import ProfilePage from "./pages/ProfilePage";
import LikedVideosPage from "./pages/LikedVideosPage";
import UploadVideoPage from "./pages/UploadVideoPage";
import MyVideosPage from "./pages/MyVideosPage";
import SearchPage from "./pages/SearchPage";
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminModerationPage from "./pages/admin/AdminModerationPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import { useAuthStore } from "./store/useAuthStore";
import { useNotificationStore } from "./store/useNotificationStore";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

function App() {
  const initAuth = useAuthStore((s) => s.initAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { fetchNotifications, connectSSE, disconnectSSE } = useNotificationStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Connect SSE & fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      connectSSE();
    } else {
      disconnectSSE();
    }

    return () => {
      disconnectSSE();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes — no sidebar/navbar */}
        <Route
          element={
            <RedirectIfAuthenticated>
              <AuthLayout />
            </RedirectIfAuthenticated>
          }
        >
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* App routes — with sidebar + navbar */}
        <Route
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/watch/:id" element={<WatchVideoPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/playlists" element={<CourseLibraryPage />} />
          <Route path="/playlists/:id" element={<CourseDetailPage />} />
          <Route path="/playlists/:id/play" element={<CoursePlayerPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/liked" element={<LikedVideosPage />} />
          <Route path="/upload" element={<UploadVideoPage />} />
          <Route path="/my-videos" element={<MyVideosPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="moderation" element={<AdminModerationPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
