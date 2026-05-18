import api from "./axios";
import type { User, Video } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  users: { total: number; active: number; suspended: number };
  videos: {
    total: number; ready: number; pending: number;
    processing: number; failed: number; banned: number;
  };
  totalViews: number;
  totalComments: number;
  totalLikes: number;
  totalPlaylists: number;
  userGrowth: DailyCount[];
  videoGrowth: DailyCount[];
  topVideos: TopVideo[];
  topCreators: TopCreator[];
  recentUploads: Video[];
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface TopVideo {
  id: string;
  title: string;
  viewCount: number;
  thumbnailUrl?: string;
  createdAt: string;
  creator: { fullName: string; avatarUrl?: string };
}

export interface TopCreator {
  id: string;
  fullName: string;
  avatarUrl?: string;
  department?: string;
  _count: { videos: number };
}

export interface AnalyticsMetrics {
  videosByCategory: { category: string; count: number; totalViews: number }[];
  viewsTimeline: DailyCount[];
  transcodingJobs: TranscodingJob[];
  systemHealth: {
    database: string;
    redis: string;
    queue: string;
    queueCounts?: {
      active: number;
      waiting: number;
      completed: number;
      failed: number;
      delayed: number;
    };
  };
  storageEstimate: {
    totalVideos: number;
    processedVideos: number;
  };
}

export interface TranscodingJob {
  id: string;
  source: string;
  videoId?: string;
  status: string;
  progress: number;
  createdAt?: string;
}

export interface PaginatedUsers {
  users: User[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface PaginatedVideos {
  videos: Video[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const adminApi = {
  // Users
  getUsers: (params?: { search?: string; department?: string; status?: string; role?: string; page?: number; limit?: number }) =>
    api.get<PaginatedUsers>("/admin/users", { params }).then(res => res.data),

  createUser: (data: { fullName: string; role?: string; department?: string; title?: string }) =>
    api.post<{ message: string; user: User; defaultPassword: string }>("/admin/users", data).then(res => res.data),

  updateUser: (id: string, data: { fullName?: string; department?: string; title?: string; role?: string }) =>
    api.put<{ message: string; user: User }>(`/admin/users/${id}`, data).then(res => res.data),

  updateUserStatus: (id: string, status: string) =>
    api.put(`/admin/users/${id}/status`, { status }).then(res => res.data),

  updateUserRole: (id: string, role: string) =>
    api.put(`/admin/users/${id}/role`, { role }).then(res => res.data),

  exportUsersCsv: () =>
    api.get("/admin/users/export-csv", { responseType: 'blob' }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }),

  importUsersCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/admin/users/import-csv", formData, {
      responseType: "blob",
      headers: {
        "Content-Type": undefined,
      },
    }).then(res => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `created_accounts_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  },

  // Moderation
  getModerationQueue: (status?: string) =>
    api.get<{ videos: Video[] }>("/admin/moderation/queue", { params: status ? { status } : {} }).then(res => res.data.videos),

  approveVideo: (videoId: string) =>
    api.post(`/admin/moderation/${videoId}/approve`).then(res => res.data),

  rejectVideo: (videoId: string, reason?: string) =>
    api.post(`/admin/moderation/${videoId}/reject`, { reason }).then(res => res.data),

  bulkApproveVideos: (videoIds: string[]) =>
    api.post("/admin/moderation/bulk-approve", { videoIds }).then(res => res.data),

  bulkRejectVideos: (videoIds: string[], reason?: string) =>
    api.post("/admin/moderation/bulk-reject", { videoIds, reason }).then(res => res.data),

  // All Videos (admin)
  getAllVideos: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<PaginatedVideos>("/admin/videos", { params }).then(res => res.data),

  // Metrics
  getDashboardMetrics: () =>
    api.get<DashboardMetrics>("/admin/metrics/dashboard").then(res => res.data),

  getAnalyticsMetrics: () =>
    api.get<AnalyticsMetrics>("/admin/metrics/analytics").then(res => res.data),
};
