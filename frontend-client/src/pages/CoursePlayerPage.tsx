import { useParams, useSearchParams } from 'react-router-dom';
import { Check, Play, Clock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import VideoPlayer from '../components/video/VideoPlayer';
import GlassPanel from '../components/ui/GlassPanel';
import CommentSection from '../components/ui/CommentSection';
import { sampleTranscript } from '../data/mockData';
import { playlistApi } from '../api/playlistApi';
import { userApi } from '../api/userApi';
import type { Video, Playlist } from '../types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function CoursePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const requestedVideoId = searchParams.get('v');

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [loading, setLoading] = useState(true);

  // Compute which videos are "done" (mock: first 2)
  const completedIds = new Set(videos.slice(0, 2).map((v) => v.id));

  useEffect(() => {
    if (id) {
      playlistApi.getPlaylistById(id)
        .then((data) => {
          setPlaylist(data);
          const vids = (data.items || [])
            .sort((a, b) => a.order - b.order)
            .map(i => i.video)
            .filter((v): v is Video => !!v);
          setVideos(vids);

          if (vids.length > 0) {
            const initial = vids.find(v => v.id === requestedVideoId) || vids[0];
            setActiveVideo(initial);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, requestedVideoId]);

  useEffect(() => {
    if (activeVideo) {
      userApi.upsertHistory(activeVideo.id, 0).catch(console.error);
    }
  }, [activeVideo]);

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-wp-on-surface-variant">Loading player...</div>;
  }

  if (!playlist || videos.length === 0 || !activeVideo) {
    return <div className="p-10 text-center text-wp-on-surface-variant">No videos available in this learning path.</div>;
  }

  // If no HLS master URL, fallback to default for UI testing
  const videoSrc = activeVideo.metadata?.hlsMasterUrl ?? 'https://raw.githubusercontent.com/muxinc/mux-player/main/packages/mux-video/test/fixtures/video.mp4';

  return (
    <div className="animate-slide-up -m-6">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Video Player */}
          <div className="flex-shrink-0">
            <VideoPlayer
              src={videoSrc}
              poster={activeVideo.thumbnailUrl || ''}
            />
          </div>

          {/* Video info */}
          <div className="p-6 space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-wp-primary mb-1 block">
                VIDEO {(videos.indexOf(activeVideo) + 1).toString().padStart(2, '0')} • PLAYING
              </span>
              <h1 className="text-xl font-bold text-wp-on-surface">{activeVideo.title}</h1>
              <p className="text-sm text-wp-on-surface-variant mt-1">{activeVideo.creator?.fullName}</p>
            </div>

            {/* AI Lesson Summary */}
            <GlassPanel className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-wp-primary" />
                <h3 className="text-sm font-semibold text-wp-on-surface">Video Summary</h3>
                <span className="text-[10px] bg-wp-primary-container/20 text-wp-primary-fixed px-2 py-0.5 rounded-full font-medium">
                  AI-Generated
                </span>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-wp-on-surface mb-2">Learning Objectives</h4>
                <div className="space-y-2">
                  {[
                    'Understand modular logistics frameworks for enterprise scale.',
                    'Analyze cross-border delay mitigation strategies.',
                    'Evaluate fiscal year R&D resource allocation models.',
                  ].map((obj, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="flex-shrink-0 w-6 h-6 rounded bg-wp-primary-container/15
                        flex items-center justify-center text-[10px] font-bold text-wp-primary">
                        {(i + 1).toString().padStart(2, '0')}
                      </span>
                      <p className="text-xs text-wp-on-surface-variant leading-relaxed">{obj}</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassPanel>

            {/* Transcript */}
            <div>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center gap-2 text-sm font-semibold text-wp-on-surface
                  hover:text-wp-primary transition-colors"
              >
                Transcript
                {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showTranscript && (
                <div className="mt-3 space-y-3 animate-fade-in">
                  {sampleTranscript.map((entry, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs font-semibold text-wp-primary">{entry.speaker}</p>
                      <p className="text-xs text-wp-on-surface-variant leading-relaxed">{entry.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <CommentSection videoId={activeVideo.id} />
          </div>
        </div>

        {/* Sidebar — Playlist Videos */}
        <aside className="w-[340px] flex-shrink-0 bg-wp-surface-container-low overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-wp-outline mb-1">
                Current Playlist
              </p>
              <h2 className="text-sm font-semibold text-wp-on-surface">{playlist.name}</h2>
            </div>

            {/* Video list */}
            <div className="space-y-0.5">
              {videos.map((video, idx) => {
                const isActive = activeVideo.id === video.id;
                const isDone = completedIds.has(video.id);
                const dur = video.metadata?.duration ?? 0;

                return (
                  <button
                    key={video.id}
                    onClick={() => setActiveVideo(video)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200
                      ${isActive
                        ? 'bg-wp-primary-container/15'
                        : 'hover:bg-wp-surface-container-high/50'
                      }`}
                  >
                    <span className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0">
                      {isDone
                        ? <Check size={14} className="text-green-400" />
                        : isActive
                          ? <Play size={12} className="text-wp-primary fill-current" />
                          : <span className="text-xs text-wp-outline">{idx + 1}</span>
                      }
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-wp-outline uppercase tracking-wide">
                        Video {String(idx + 1).padStart(2, '0')}
                        {isActive && <span className="text-wp-primary ml-1">• PLAYING</span>}
                      </p>
                      <p className={`text-xs font-medium truncate ${isActive ? 'text-wp-primary' : 'text-wp-on-surface'}`}>
                        {video.title}
                      </p>
                    </div>
                    <span className="text-[10px] text-wp-outline flex-shrink-0 flex items-center gap-0.5">
                      <Clock size={10} />
                      {formatDuration(dur)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
