import { useParams } from 'react-router-dom';
import {
  ThumbsUp, Bookmark, Share2, Download, Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import VideoPlayer from '../components/video/VideoPlayer';
import VideoCard from '../components/ui/VideoCard';
import GlassPanel from '../components/ui/GlassPanel';
import CommentSection from '../components/ui/CommentSection';
import { videoApi } from '../api/videoApi';
import type { Video, AISummary } from '../types';

export default function WatchVideoPage() {
  const { id } = useParams<{ id: string }>();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [upNextVideos, setUpNextVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [videoData, summaryData, recommendations] = await Promise.all([
          videoApi.getVideoById(id),
          videoApi.getAiSummary(id).catch(() => null), // fail gracefully
          videoApi.getVideos(1, 6, undefined, 'READY').catch(() => ({ videos: [] }))
        ]);
        
        setVideo(videoData);
        if (summaryData && summaryData.keyTakeaways) {
          setAiSummary(summaryData);
        } else {
          setAiSummary(null);
        }
        
        // Filter out current video from recommendations
        setUpNextVideos(recommendations.videos.filter((v: Video) => v.id !== id).slice(0, 5));
      } catch (err) {
        console.error('Failed to load video details', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-wp-on-surface-variant">Loading video...</div>;
  }

  if (!video) {
    return <div className="p-10 text-center text-wp-on-surface-variant">Video not found.</div>;
  }

  return (
    <div className="animate-slide-up">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Video Player */}
          {/* Default to an empty string if videoUrl is unavailable. The Video module on FE might require a valid URL.*/}
          {/* In the backend we store hlsMasterUrl or use a direct url... Let's assume frontend can play the master url */}
          <VideoPlayer 
            src={video.metadata?.hlsMasterUrl || 'https://raw.githubusercontent.com/muxinc/mux-player/main/packages/mux-video/test/fixtures/video.mp4'} 
            poster={video.thumbnailUrl || ''} 
          />

          {/* Video info */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-wp-on-surface tracking-tight"
              style={{ letterSpacing: '-0.02em' }}>
              {video.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={video.creator.avatarUrl || `https://ui-avatars.com/api/?name=${video.creator.fullName}`}
                  alt={video.creator.fullName}
                  className="w-10 h-10 rounded-full bg-wp-surface-container-high object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-wp-on-surface">{video.creator.fullName}</p>
                  <p className="text-xs text-wp-outline">{video.viewCount.toLocaleString()} views</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="btn-secondary flex items-center gap-2 text-xs">
                  <ThumbsUp size={16} /> {video._count?.likes || 0}
                </button>
                <button className="btn-ghost flex items-center gap-2 text-xs">
                  <Bookmark size={16} /> Save
                </button>
                <button className="btn-ghost flex items-center gap-2 text-xs">
                  <Share2 size={16} /> Share
                </button>
                <button className="btn-ghost flex items-center gap-2 text-xs">
                  <Download size={16} />
                </button>
              </div>
            </div>
            {video.description && (
              <p className="text-sm text-wp-on-surface-variant whitespace-pre-wrap">{video.description}</p>
            )}
          </div>

          {/* AI Executive Summary */}
          {aiSummary && aiSummary.keyTakeaways && aiSummary.keyTakeaways.length > 0 && (
            <GlassPanel className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-wp-primary" />
                <h3 className="text-base font-semibold text-wp-on-surface">Executive Summary</h3>
                <span className="text-[10px] bg-wp-primary-container/20 text-wp-primary-fixed px-2 py-0.5 rounded-full font-medium">
                  AI Generated
                </span>
              </div>

              {/* Key Takeaways */}
              <div>
                <h4 className="text-sm font-semibold text-wp-on-surface mb-3">Key Takeaways</h4>
                <div className="space-y-3">
                  {aiSummary.keyTakeaways.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-wp-primary-container/15
                        flex items-center justify-center text-xs font-bold text-wp-primary">
                        {(item.order || idx + 1).toString().padStart(2, '0')}
                      </span>
                      <p className="text-sm text-wp-on-surface-variant leading-relaxed">
                        {typeof item === 'string' ? item : item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment */}
              {aiSummary.sentimentAnalysis && (
                <div className="p-4 bg-wp-surface-container-low/50 rounded-wp">
                  <h4 className="text-xs font-semibold text-wp-outline uppercase tracking-wider mb-2">
                    Sentiment Analysis
                  </h4>
                  <p className="text-sm text-wp-on-surface-variant italic">
                    "{aiSummary.sentimentAnalysis}"
                  </p>
                </div>
              )}

              {/* Required Actions */}
              {aiSummary.requiredActions && aiSummary.requiredActions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-wp-on-surface mb-2">Required Actions</h4>
                  <ul className="space-y-1.5">
                    {aiSummary.requiredActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-wp-on-surface-variant">
                        <span className="w-1.5 h-1.5 rounded-full bg-wp-tertiary mt-1.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </GlassPanel>
          )}

          {/* Comments */}
          <CommentSection />
        </div>

        {/* Sidebar — Up Next */}
        {upNextVideos.length > 0 && (
          <aside className="w-full xl:w-[340px] flex-shrink-0 space-y-4">
            <h3 className="text-base font-semibold text-wp-on-surface">Up Next</h3>
            <div className="space-y-4">
              {upNextVideos.map((v) => (
                <VideoCard key={v.id} video={v} size="lg" showChannel />
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
