import api from './axios';
import type { AxiosProgressEvent } from 'axios';
import type { Video } from '../types';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const videoApi = {
  getVideos: async (page = 1, limit = 12, category?: string, status?: string, q?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (q) params.append('q', q);
    
    const res = await api.get<{ videos: Video[], pagination: PaginationInfo }>('/videos?' + params.toString());
    return res.data;
  },

  getVideoById: async (id: string) => {
    const res = await api.get<{ video: Video }>(`/videos/${id}`);
    return res.data.video;
  },

  uploadVideo: async (formData: FormData, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void) => {
    const res = await api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      timeout: 0,
    });
    return res.data;
  },
  
  getAiSummary: async (videoId: string) => {
    const res = await api.get(`/videos/${videoId}/ai-summary`);
    return res.data.summary;
  },

  recordView: async (videoId: string) => {
    const res = await api.post(`/videos/${videoId}/view`);
    return res.data;
  }
};
