import api from './axios';

export interface CreateRoomPayload {
  displayName: string;
  maxParticipants?: number;
  invitedDepartments?: string[];
}

export interface MeetingRoomResponse {
  room: {
    id: string;
    name: string;
    displayName: string;
    hostId: string;
    status: 'WAITING' | 'ACTIVE' | 'ENDED';
    maxParticipants: number;
    egressId?: string;
    startedAt?: string;
    endedAt?: string;
    createdAt: string;
    host: {
      id: string;
      fullName: string;
      avatarUrl?: string;
    };
  };
  token: string;
  serverUrl: string;
  notificationCount?: number;
}

export interface JoinRoomResponse {
  token: string;
  serverUrl: string;
  room: {
    id: string;
    name: string;
    displayName: string;
    hostId: string;
    status: string;
  };
  isHost: boolean;
}

export const meetingApi = {
  createRoom: async (payload: CreateRoomPayload): Promise<MeetingRoomResponse> => {
    const res = await api.post('/meetings', payload);
    return res.data;
  },

  listRooms: async (status?: string, page = 1, limit = 12) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    const res = await api.get('/meetings?' + params.toString());
    return res.data;
  },

  joinRoom: async (roomName: string): Promise<JoinRoomResponse> => {
    const res = await api.post(`/meetings/${roomName}/join`);
    return res.data;
  },

  getRoomDetails: async (roomName: string) => {
    const res = await api.get(`/meetings/${roomName}`);
    return res.data.room;
  },

  startRecording: async (roomName: string) => {
    const res = await api.post(`/meetings/${roomName}/record`);
    return res.data;
  },

  endRoom: async (roomName: string) => {
    const res = await api.post(`/meetings/${roomName}/end`);
    return res.data;
  },
};
