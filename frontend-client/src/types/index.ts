// ============================
// WayPoint — TypeScript Types
// ============================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'viewer' | 'creator' | 'admin';
  title: string;
  department: string;
  stats: {
    videosViewed: number;
    coursesCompleted: number;
    certifications: number;
  };
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string; // m3u8 or mp4
  duration: number; // seconds
  views: number;
  likes: number;
  createdAt: string;
  channel: {
    id: string;
    name: string;
    avatar: string;
  };
  category: string;
  tags: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  instructor: Instructor;
  lessons: Lesson[];
  totalDuration: number; // seconds
  enrolledCount: number;
  category: string;
  progress?: number; // 0-100
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface Lesson {
  id: string;
  title: string;
  duration: number; // seconds
  videoUrl: string;
  order: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
}

export interface HistoryItem {
  id: string;
  video: Video;
  watchedAt: string;
  progress: number; // 0-100
  watchedDuration: number; // seconds
}

export interface Playlist {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoCount: number;
  isPrivate: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'xls' | 'doc' | 'ppt';
  size: string;
  url: string;
}

export interface AISummary {
  keyTakeaways: { order: number; text: string }[];
  sentimentAnalysis: string;
  requiredActions: string[];
}

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: number; // seconds
}

export interface Notification {
  id: string;
  type: 'training' | 'townhall' | 'course_update' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}
