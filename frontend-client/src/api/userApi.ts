import api from './axios';
import type { HistoryItem, Video } from '../types';

export const userApi = {
  getHistory: async () => {
    const res = await api.get<{ history: HistoryItem[] }>('/users/history');
    return res.data.history;
  },

  upsertHistory: async (videoId: string, lastSecond: number) => {
    const res = await api.post<{ history: HistoryItem }>('/users/history', { videoId, lastSecond });
    return res.data.history;
  },

  getLikedVideos: async () => {
    const res = await api.get<{ videos: Video[] }>('/users/liked-videos');
    return res.data.videos;
  },
  
  getNotifications: async () => {
    const res = await api.get('/users/notifications');
    return res.data.notifications;
  },
  
  getActivities: async () => {
    const res = await api.get('/users/activities');
    return res.data.activities;
  },
  
  getSessions: async () => {
    const res = await api.get('/users/sessions');
    return res.data.sessions;
  }
};
