import api from './axios';
import type { DepartmentOption, HistoryItem, Video, User, Notification } from '../types';

export const userApi = {
  getMe: async () => {
    const res = await api.get<{ user: User }>('/users/me');
    return res.data.user;
  },

  updateMe: async (data: { fullName?: string; title?: string; department?: string; avatarUrl?: string }) => {
    const res = await api.put<{ user: User }>('/users/me', data);
    return res.data.user;
  },

  getMyVideos: async () => {
    const res = await api.get<{ videos: Video[] }>('/users/me/videos');
    return res.data.videos;
  },

  changePassword: async (oldPassword?: string, newPassword?: string) => {
    const res = await api.post('/auth/change-password', { oldPassword, newPassword });
    return res.data;
  },

  getHistory: async () => {
    const res = await api.get<{ history: HistoryItem[] }>('/users/history');
    return res.data.history;
  },

  upsertHistory: async (videoId: string, lastSecond: number) => {
    const res = await api.post<{ history: HistoryItem }>('/users/history', { videoId, lastSecond });
    return res.data.history;
  },

  getLikedVideos: async () => {
    // FIX: Match backend response `{ likedVideos: [{ likedAt, video }] }`
    const res = await api.get<{ likedVideos: { likedAt: string; video: Video }[] }>('/users/liked-videos');
    return res.data.likedVideos;
  },
  
  getNotifications: async (cursor?: string, limit = 10) => {
    const params: Record<string, string> = { limit: String(limit) };
    if (cursor) params.cursor = cursor;
    const res = await api.get<{ notifications: Notification[]; nextCursor: string | null }>('/users/notifications', { params });
    return res.data;
  },

  getDepartments: async () => {
    const res = await api.get<{ departments: DepartmentOption[] }>('/users/departments');
    return res.data.departments;
  },

  markNotificationRead: async (id: string) => {
    const res = await api.patch(`/users/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await api.post('/users/notifications/read-all');
    return res.data;
  },
  
  getActivities: async () => {
    const res = await api.get('/users/activities');
    return res.data.activities;
  },
  
  getSessions: async () => {
    const res = await api.get('/users/sessions');
    return res.data.sessions;
  },

  revokeSession: async (sessionId: string) => {
    const res = await api.delete(`/users/sessions/${sessionId}`);
    return res.data;
  }
};
