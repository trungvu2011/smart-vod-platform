import api from "./axios";
import type { Comment } from "../types";

export const commentApi = {
  getComments: async (videoId: string) => {
    const res = await api.get<{ comments: Comment[] }>(
      `/videos/${videoId}/comments`,
    );
    return res.data.comments;
  },

  addComment: async (videoId: string, content: string, parentId?: string) => {
    const res = await api.post<{ comment: Comment }>(
      `/videos/${videoId}/comments`,
      { content, parentId },
    );
    return res.data.comment;
  },

  toggleLike: async (videoId: string) => {
    const res = await api.post<{ liked: boolean; message: string }>(
      `/videos/${videoId}/like`,
    );
    return res.data;
  },

  toggleCommentLike: async (videoId: string, commentId: string) => {
    const res = await api.post<{
      liked: boolean;
      likes: number;
      message: string;
      commentId: string;
    }>(`/videos/${videoId}/comments/${commentId}/like`);
    return res.data;
  },
};
