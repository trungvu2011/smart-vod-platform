import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Radio, Square, Users, ArrowLeft } from 'lucide-react';
import { meetingApi } from '../api/meetingApi';

// =========================================
// Host Controls — Recording + End Meeting
// =========================================
function HostControls({ roomName, isHost }: { roomName: string; isHost: boolean }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [endingRoom, setEndingRoom] = useState(false);
  const navigate = useNavigate();

  const handleStartRecording = async () => {
    try {
      setRecordingLoading(true);
      await meetingApi.startRecording(roomName);
      setIsRecording(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể bắt đầu ghi hình';
      if (msg.includes('Đang ghi hình rồi')) {
        setIsRecording(true);
      } else {
        alert(msg);
      }
    } finally {
      setRecordingLoading(false);
    }
  };

  const handleEndRoom = async () => {
    if (!confirm('Bạn có chắc muốn kết thúc cuộc họp? Tất cả người tham gia sẽ bị ngắt kết nối.')) return;
    try {
      setEndingRoom(true);
      await meetingApi.endRoom(roomName);
      navigate('/meetings');
    } catch (err) {
      console.error('Failed to end room:', err);
      alert('Không thể kết thúc phòng');
    } finally {
      setEndingRoom(false);
    }
  };

  if (!isHost) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Recording toggle */}
      {!isRecording ? (
        <button
          onClick={handleStartRecording}
          disabled={recordingLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/10 text-red-400
            hover:bg-red-600/20 border border-red-600/20 text-sm font-medium transition-all
            disabled:opacity-50"
          title="Bắt đầu ghi hình"
        >
          {recordingLoading ? (
            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Radio size={16} />
          )}
          Ghi hình
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-400
          border border-red-500/30 text-sm font-medium animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          Đang ghi...
        </div>
      )}

      {/* End Meeting */}
      <button
        onClick={handleEndRoom}
        disabled={endingRoom}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white
          hover:bg-red-700 text-sm font-medium transition-all disabled:opacity-50
          active:scale-95"
        title="Kết thúc cuộc họp"
      >
        {endingRoom ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Square size={14} />
        )}
        Kết thúc
      </button>
    </div>
  );
}

// =========================================
// Meeting Room Page — Main Component
// =========================================
export default function MeetingRoomPage() {
  const { roomName } = useParams<{ roomName: string }>();
  const navigate = useNavigate();

  const [token, setToken] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const joinRoom = useCallback(async () => {
    if (!roomName) return;
    try {
      setLoading(true);
      setError(null);
      const res = await meetingApi.joinRoom(roomName);
      setToken(res.token);
      setServerUrl(res.serverUrl);
      setIsHost(res.isHost);
      setDisplayName(res.room.displayName || roomName);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể tham gia phòng họp';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [roomName]);

  useEffect(() => {
    joinRoom();
  }, [joinRoom]);

  const handleDisconnected = useCallback(() => {
    navigate('/meetings');
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-wp-surface gap-4">
        <div className="w-12 h-12 border-4 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin" />
        <p className="text-wp-on-surface-variant text-sm">Đang kết nối phòng họp...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-wp-surface gap-4">
        <div className="p-4 rounded-full bg-red-500/10">
          <Users size={32} className="text-red-400" />
        </div>
        <p className="text-wp-on-surface font-semibold text-lg">Không thể kết nối</p>
        <p className="text-wp-on-surface-variant text-sm max-w-md text-center">{error}</p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => navigate('/meetings')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wp-surface-container
              text-wp-on-surface-variant text-sm font-medium hover:bg-wp-surface-container-high transition-colors"
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
          <button
            onClick={joinRoom}
            className="px-5 py-2.5 rounded-xl bg-wp-gradient text-wp-on-primary
              text-sm font-semibold shadow-lg hover:shadow-wp-glow active:scale-95 transition-all"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // No token
  if (!token || !serverUrl) {
    return (
      <div className="h-screen flex items-center justify-center bg-wp-surface">
        <p className="text-wp-on-surface-variant">Đang chuẩn bị kết nối...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#111] overflow-hidden">
      {/* Custom Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a2e] border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/meetings')}
            className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-white font-semibold text-sm">{displayName}</h2>
            <p className="text-zinc-500 text-xs">Room: {roomName}</p>
          </div>
        </div>

        <HostControls roomName={roomName!} isHost={isHost} />
      </div>

      {/* LiveKit Video Conference */}
      <div className="flex-1 overflow-hidden">
        <LiveKitRoom
          serverUrl={serverUrl}
          token={token}
          connect={true}
          audio={true}
          video={true}
          onDisconnected={handleDisconnected}
          data-lk-theme="default"
          style={{ height: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
