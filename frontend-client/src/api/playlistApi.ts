import api from './axios';
import type { Playlist, PlaylistItem } from '../types';

export const playlistApi = {
  getMyPlaylists: async () => {
    const res = await api.get<{ playlists: Playlist[] }>('/playlists');
    return res.data.playlists;
  },

  getPublicPlaylists: async (page = 1, limit = 24, q?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.append('q', q);
    const res = await api.get<{ playlists: Playlist[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('/playlists/public?' + params.toString());
    return res.data;
  },

  createPlaylist: async (name: string, isPrivate: boolean) => {
    const res = await api.post<{ playlist: Playlist }>('/playlists', { name, isPrivate });
    return res.data.playlist;
  },

  getPlaylistById: async (id: string) => {
    const res = await api.get<{ playlist: Playlist }>(`/playlists/${id}`);
    return res.data.playlist;
  },

  updatePlaylist: async (id: string, data: { name?: string; isPrivate?: boolean }) => {
    const res = await api.put<{ playlist: Playlist }>(`/playlists/${id}`, data);
    return res.data.playlist;
  },

  deletePlaylist: async (id: string) => {
    const res = await api.delete(`/playlists/${id}`);
    return res.data;
  },

  addVideo: async (playlistId: string, videoId: string) => {
    const res = await api.post<{ item: PlaylistItem }>(`/playlists/${playlistId}/videos`, { videoId });
    return res.data.item;
  },

  removeVideo: async (playlistId: string, videoId: string) => {
    const res = await api.delete(`/playlists/${playlistId}/videos/${videoId}`);
    return res.data;
  }
};
