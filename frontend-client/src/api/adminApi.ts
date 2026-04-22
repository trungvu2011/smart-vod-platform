import api from "./axios";
import type { User, Video } from "../types";

export interface DashboardMetrics {
  storageUsedTB: number;
  storageTotalTB: number;
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
}

export interface AnalyticsMetrics {
  transcodingJobs: Array<{
    id: string;
    source: string;
    status: string;
    progress: number;
    bitrate: string;
  }>;
  whisperHealth: {
    accuracy: number;
    latencyMs: number;
    languagesSupported: number;
  };
}

export const adminApi = {
  // Users
  getUsers: () => api.get<{ users: User[] }>("/admin/users").then(res => res.data.users),
  updateUserStatus: (id: string, status: string) => api.put(`/admin/users/${id}/status`, { status }).then(res => res.data),
  updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }).then(res => res.data),

  // Moderation
  getModerationQueue: () => api.get<{ videos: Video[] }>("/admin/moderation/queue").then(res => res.data.videos),
  approveVideo: (videoId: string) => api.post(`/admin/moderation/${videoId}/approve`).then(res => res.data),
  rejectVideo: (videoId: string, reason?: string) => api.post(`/admin/moderation/${videoId}/reject`, { reason }).then(res => res.data),

  // Metrics
  getDashboardMetrics: () => api.get<DashboardMetrics>("/admin/metrics/dashboard").then(res => res.data),
  getAnalyticsMetrics: () => api.get<AnalyticsMetrics>("/admin/metrics/analytics").then(res => res.data),
};
