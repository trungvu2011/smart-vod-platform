import { useParams } from 'react-router-dom';
import {
  ThumbsUp, Bookmark, Share2, Download, FileText,
  FileSpreadsheet, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import VideoPlayer from '../components/video/VideoPlayer';
import VideoCard from '../components/ui/VideoCard';
import GlassPanel from '../components/ui/GlassPanel';
import CommentSection from '../components/ui/CommentSection';
import {
  featuredVideo, discoveryVideos, upNextVideos,
  sampleAISummary, sampleTranscript, sampleAttachments
} from '../data/mockData';
import type { Video } from '../types';

export default function WatchVideoPage() {
  const { id } = useParams<{ id: string }>();
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  // Find the video (mock)
  const allVideos = [featuredVideo, ...discoveryVideos, ...upNextVideos];
  const video: Video = allVideos.find((v) => v.id === id) || featuredVideo;

  const fileIcon = {
    pdf: <FileText size={18} className="text-red-400" />,
    xls: <FileSpreadsheet size={18} className="text-green-400" />,
    doc: <FileText size={18} className="text-blue-400" />,
    ppt: <FileText size={18} className="text-orange-400" />,
  };

  return (
    <div className="animate-slide-up">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Video Player */}
          <VideoPlayer src={video.videoUrl} poster={video.thumbnailUrl} />

          {/* Video info */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-wp-on-surface tracking-tight"
              style={{ letterSpacing: '-0.02em' }}>
              {video.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={video.channel.avatar}
                  alt={video.channel.name}
                  className="w-10 h-10 rounded-full bg-wp-surface-container-high"
                />
                <div>
                  <p className="text-sm font-medium text-wp-on-surface">{video.channel.name}</p>
                  <p className="text-xs text-wp-outline">{video.views.toLocaleString()} views</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="btn-secondary flex items-center gap-2 text-xs">
                  <ThumbsUp size={16} /> {video.likes}
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
          </div>

          {/* AI Executive Summary */}
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
                {sampleAISummary.keyTakeaways.map((item) => (
                  <div key={item.order} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-wp-primary-container/15
                      flex items-center justify-center text-xs font-bold text-wp-primary">
                      {item.order.toString().padStart(2, '0')}
                    </span>
                    <p className="text-sm text-wp-on-surface-variant leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment */}
            <div className="p-4 bg-wp-surface-container-low/50 rounded-wp">
              <h4 className="text-xs font-semibold text-wp-outline uppercase tracking-wider mb-2">
                Sentiment Analysis
              </h4>
              <p className="text-sm text-wp-on-surface-variant italic">
                "{sampleAISummary.sentimentAnalysis}"
              </p>
            </div>

            {/* Required Actions */}
            <div>
              <h4 className="text-sm font-semibold text-wp-on-surface mb-2">Required Actions</h4>
              <ul className="space-y-1.5">
                {sampleAISummary.requiredActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-wp-on-surface-variant">
                    <span className="w-1.5 h-1.5 rounded-full bg-wp-tertiary mt-1.5 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </GlassPanel>

          {/* Attachments */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-wp-on-surface">Attachments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sampleAttachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  className="flex items-center gap-3 p-4 bg-wp-surface-container rounded-wp-lg
                    hover:bg-wp-surface-container-high transition-colors group"
                >
                  {fileIcon[att.type]}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-wp-on-surface truncate group-hover:text-wp-primary transition-colors">
                      {att.name}
                    </p>
                    <p className="text-xs text-wp-outline">{att.type.toUpperCase()} • {att.size}</p>
                  </div>
                  <Download size={16} className="text-wp-outline group-hover:text-wp-on-surface transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Transcript */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-wp-primary" />
                <h3 className="text-base font-semibold text-wp-on-surface">AI Generated Transcript</h3>
              </div>
              <button
                onClick={() => setShowFullTranscript(!showFullTranscript)}
                className="btn-ghost text-xs flex items-center gap-1"
              >
                {showFullTranscript ? 'Collapse' : 'Expand'}
                {showFullTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            <div className={`space-y-4 overflow-hidden transition-all duration-300 ${
              showFullTranscript ? 'max-h-[2000px]' : 'max-h-[200px]'
            }`}>
              {sampleTranscript.map((entry, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs font-semibold text-wp-primary">{entry.speaker}</p>
                  <p className="text-sm text-wp-on-surface-variant leading-relaxed">{entry.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <CommentSection />
        </div>

        {/* Sidebar — Up Next */}
        <aside className="w-full xl:w-[340px] flex-shrink-0 space-y-4">
          <h3 className="text-base font-semibold text-wp-on-surface">Up Next</h3>
          <div className="space-y-4">
            {upNextVideos.map((v) => (
              <VideoCard key={v.id} video={v} size="lg" showChannel />
            ))}
            {discoveryVideos.slice(0, 2).map((v) => (
              <VideoCard key={v.id} video={v} size="lg" showChannel />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
