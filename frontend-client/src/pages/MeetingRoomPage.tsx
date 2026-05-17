import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Radio, Square, Users, ArrowLeft, Camera, CameraOff, Mic, MicOff, LogIn } from 'lucide-react';
import { meetingApi } from '../api/meetingApi';

const VIRTUAL_CAMERA_KEYWORDS = [
  'phone',
  'android',
  'iphone',
  'continuity',
  'droidcam',
  'epoccam',
  'ivcam',
  'iriun',
  'camo',
  'obs',
  'virtual',
  'snap camera',
  'xsplit',
  'manycam',
  'youcam',
  'phone link',
  'link to windows',
];

const LAPTOP_CAMERA_KEYWORDS = [
  'integrated',
  'built-in',
  'internal',
  'user facing',
  'front',
  'hd camera',
];

const scoreVideoDevice = (label: string) => {
  const normalized = label.toLowerCase();
  if (VIRTUAL_CAMERA_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return -100;
  }

  let score = 0;
  LAPTOP_CAMERA_KEYWORDS.forEach((keyword) => {
    if (normalized.includes(keyword)) score += 10;
  });

  if (normalized.includes('usb')) score += 2;
  return score;
};

const pickPreferredCamera = (videoInputs: MediaDeviceInfo[]) => {
  if (videoInputs.length === 0) return null;

  return [...videoInputs].sort((a, b) => {
    const scoreDiff = scoreVideoDevice(b.label) - scoreVideoDevice(a.label);
    if (scoreDiff !== 0) return scoreDiff;
    return a.label.localeCompare(b.label);
  })[0];
};

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
  const [connectNow, setConnectNow] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [preferredCameraId, setPreferredCameraId] = useState<string | null>(null);
  const [preferredCameraLabel, setPreferredCameraLabel] = useState<string>('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  const stopPreviewStream = useCallback(() => {
    if (!previewStreamRef.current) return;
    previewStreamRef.current.getTracks().forEach((track) => track.stop());
    previewStreamRef.current = null;
    setPreviewStream(null);
    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }
  }, []);

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

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  useEffect(() => {
    if (loading || error || connectNow) return;
    if (!cameraEnabled) {
      stopPreviewStream();
      setPreferredCameraId(null);
      setPreferredCameraLabel('');
      return;
    }

    let cancelled = false;

    const startPreview = async () => {
      if (previewStreamRef.current) return;

      try {
        setPreviewError(null);
        const initialStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (cancelled) {
          initialStream.getTracks().forEach((track) => track.stop());
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((device) => device.kind === 'videoinput');
        const preferredCamera = pickPreferredCamera(videoInputs);

        let nextStream = initialStream;
        if (preferredCamera?.deviceId) {
          const currentCameraId = initialStream.getVideoTracks()[0]?.getSettings()?.deviceId;
          if (preferredCamera.deviceId !== currentCameraId) {
            initialStream.getTracks().forEach((track) => track.stop());
            nextStream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: preferredCamera.deviceId } },
              audio: false,
            });
          }
          setPreferredCameraId(preferredCamera.deviceId);
          setPreferredCameraLabel(preferredCamera.label || 'Laptop camera');
        } else {
          const fallbackCameraId = initialStream.getVideoTracks()[0]?.getSettings()?.deviceId;
          setPreferredCameraId(fallbackCameraId || null);
          setPreferredCameraLabel('Default camera');
        }

        if (cancelled) {
          nextStream.getTracks().forEach((track) => track.stop());
          return;
        }

        previewStreamRef.current = nextStream;
        setPreviewStream(nextStream);
      } catch (err) {
        console.error('Failed to access camera preview:', err);
        if (!cancelled) {
          setCameraEnabled(false);
          setPreferredCameraId(null);
          setPreferredCameraLabel('');
          setPreviewError('Không thể truy cập camera. Bạn vẫn có thể vào phòng mà không bật camera.');
        }
      }
    };

    startPreview();

    return () => {
      cancelled = true;
    };
  }, [cameraEnabled, connectNow, error, loading, stopPreviewStream]);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        previewRef.current.srcObject = null;
      }
      stopPreviewStream();
    };
  }, [stopPreviewStream]);

  const handleDisconnected = useCallback(() => {
    navigate('/meetings');
  }, [navigate]);

  const handleEnterRoom = () => {
    setJoining(true);
    stopPreviewStream();
    setConnectNow(true);
  };

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

  if (!connectNow) {
    return (
      <div className="h-screen bg-[#0b1020] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black relative min-h-[320px]">
            {cameraEnabled && previewStream ? (
              <video
                ref={previewRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover min-h-[320px]"
              />
            ) : (
              <div className="w-full h-full min-h-[320px] flex flex-col items-center justify-center gap-3 text-zinc-300 bg-zinc-900">
                <CameraOff size={28} />
                <p className="text-sm">Camera đang tắt</p>
              </div>
            )}
            <div className="absolute left-4 bottom-4 px-3 py-1.5 rounded-lg bg-black/55 text-xs font-medium">
              Preview trước khi vào họp
            </div>
            {cameraEnabled && preferredCameraLabel ? (
              <div className="absolute right-4 bottom-4 px-3 py-1.5 rounded-lg bg-black/55 text-xs font-medium max-w-[70%] truncate">
                {preferredCameraLabel}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#11172b] p-6 flex flex-col gap-5">
            <div>
              <p className="text-xs text-zinc-400">Chuẩn bị tham gia</p>
              <h2 className="text-xl font-semibold mt-1">{displayName}</h2>
              <p className="text-sm text-zinc-400 mt-1">Room: {roomName}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMicEnabled((prev) => !prev)}
                className={`rounded-xl p-3 border text-sm font-medium transition-colors ${
                  micEnabled
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                </div>
                {micEnabled ? 'Mic bật' : 'Mic tắt'}
              </button>

              <button
                onClick={() => setCameraEnabled((prev) => !prev)}
                className={`rounded-xl p-3 border text-sm font-medium transition-colors ${
                  cameraEnabled
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  {cameraEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
                </div>
                {cameraEnabled ? 'Cam bật' : 'Cam tắt'}
              </button>
            </div>

            {previewError ? (
              <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-400/20 rounded-lg px-3 py-2">
                {previewError}
              </div>
            ) : null}

            <div className="mt-auto flex gap-3">
              <button
                onClick={() => navigate('/meetings')}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handleEnterRoom}
                disabled={joining}
                className="flex-1 py-2.5 rounded-xl bg-wp-gradient text-wp-on-primary text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {joining ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                Vào phòng
              </button>
            </div>
          </div>
        </div>
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
          connect={connectNow}
          audio={micEnabled}
          video={cameraEnabled ? (preferredCameraId ? { deviceId: preferredCameraId } : true) : false}
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
