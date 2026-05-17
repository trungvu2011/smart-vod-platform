// ============================
// WayPoint — TypeScript Types (synced with backend Prisma schema)
// ============================

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  title?: string;
  department?: string;
  // Client-side computed / extra fields from API
  videosViewed?: number;
  certifications?: number;
}

export interface VideoCreator {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface VideoMetadata {
  duration: number; // seconds, computed by video-worker
  hlsMasterUrl?: string;
  subtitleUrl?: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED" | "BANNED";
  viewCount: number;
  createdAt: string;
  creator: VideoCreator;
  metadata?: VideoMetadata;
  category?: string;
  visibility: "PUBLIC" | "ORG" | "PRIVATE";
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface HistoryItem {
  id: string;
  userId: string;
  videoId: string;
  lastSecond: number; // seconds watched up to
  watchedAt: string;
  video: Video;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  isPrivate: boolean;
  createdAt: string;
  _count?: { items: number };
  items?: PlaylistItem[];
  user?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    title?: string;
  };
}

export interface PlaylistItem {
  playlistId: string;
  videoId: string;
  order: number;
  addedAt: string;
  video?: Video;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  parentId?: string;
  content: string;
  createdAt: string;
  likes?: number;
  liked?: boolean;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  _count?: {
    replies: number;
    likes?: number;
  };
}

export interface Attachment {
  id: string;
  name: string;
  type: "pdf" | "xls" | "doc" | "ppt";
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
  type: string; // "training" | "townhall" | "course_update" | "system" | "meeting"
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface DepartmentOption {
  name: string;
  userCount: number;
}

// ============================
// Meeting Types
// ============================

export interface MeetingRoom {
  id: string;
  name: string;
  displayName: string;
  hostId: string;
  status: "WAITING" | "ACTIVE" | "ENDED";
  maxParticipants: number;
  egressId?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  host: VideoCreator;
  _count?: {
    participants: number;
    recordings: number;
  };
}

export interface MeetingParticipant {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: string;
  leftAt?: string;
  user: VideoCreator;
}
