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
import { useAuthStore } from "./store/useAuthStore";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

function App() {
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
          <Route path="/courses" element={<CourseLibraryPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/courses/:id/play" element={<CoursePlayerPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/liked" element={<LikedVideosPage />} />
          <Route path="/upload" element={<UploadVideoPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
