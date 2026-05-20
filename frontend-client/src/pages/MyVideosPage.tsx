import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Video as VideoIcon, Plus, AlertCircle, Clock3 } from "lucide-react";
import VideoCard from "../components/ui/VideoCard";
import { userApi } from "../api/userApi";
import { API_BASE_URL } from "../api/axios";
import type { Video } from "../types";

export default function MyVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      const data = await userApi.getMyVideos();
      setVideos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center animate-pulse text-wp-on-surface-variant">
        Loading your videos...
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-slide-up">
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-wp-on-surface flex items-center gap-2">
              <VideoIcon size={18} className="text-wp-primary" /> My Videos
            </h2>
            <p className="text-sm text-wp-on-surface-variant mt-0.5">
              Manage your uploaded videos and track processing status.
            </p>
          </div>
          <Link
            to="/upload"
            className="flex items-center gap-1.5 text-sm font-medium text-wp-primary
              hover:text-wp-primary-fixed transition-colors"
          >
            <Plus size={16} /> Upload New
          </Link>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map((v) =>
              v.status === "READY" ? (
                <VideoCard key={v.id} video={v} size="lg" progress={undefined} />
              ) : v.status === "FAILED" ? (
                <FailedVideoCard key={v.id} video={v} />
              ) : (
                <ProgressiveVideoCard
                  key={v.id}
                  video={v}
                  onComplete={fetchVideos}
                />
              )
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

// ─── Subcomponents cho trạng thái đặc biệt ────────────────────────────────────

function ProgressiveVideoCard({
  video,
  onComplete,
}: {
  video: Video;
  onComplete: () => void;
}) {
  const [workerProgress, setWorkerProgress] = useState(0);
  const [stateStatus, setStateStatus] = useState("processing");
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/videos/${video.id}/progress`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "connected" && !data.state) {
          return;
        }

        if (data.state === "completed") {
          setWorkerProgress(100);
          setStateStatus("awaiting_review");
          eventSource.close();
        } else if (data.state === "failed") {
          setStateStatus("failed");
          eventSource.close();
          onComplete(); // refresh to show FAILED card
        } else {
          setWorkerProgress(data.progress || 0);
          setStateStatus(data.state || "processing");
        }
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [video.id, onComplete]);

  const waitingApproval = stateStatus === "awaiting_review";

  return (
    <div className={`block max-w-full ${waitingApproval ? "opacity-95" : "opacity-80 cursor-wait"}`}>
      <div className="relative aspect-video rounded-wp-lg overflow-hidden bg-wp-surface-container-high mb-3 flex flex-col items-center justify-center p-4">
        {waitingApproval ? (
          <>
            <p className="text-amber-300 mb-3 uppercase tracking-widest text-[10px] font-bold flex items-center gap-1.5">
              <Clock3 size={12} /> Waiting for admin approval
            </p>
            <div className="w-full h-1.5 bg-wp-surface-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-300/80 transition-all duration-300"
                style={{ width: "100%" }}
              />
            </div>
            <p className="mt-2 text-[10px] text-wp-on-surface-variant font-medium">
              Processing complete. Pending moderation.
            </p>
          </>
        ) : (
          <>
            <p className="text-wp-tertiary animate-pulse mb-3 uppercase tracking-widest text-[10px] font-bold">
              Processing in background...
            </p>
            <div className="w-full h-1.5 bg-wp-surface-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-wp-tertiary transition-all duration-300 shadow-wp-glow shadow-wp-tertiary/20"
                style={{ width: `${Math.min(workerProgress, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] text-wp-on-surface-variant font-medium">
              {Math.round(workerProgress)}% complete
            </p>
          </>
        )}
      </div>
      <div className="flex gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-wp-on-surface leading-snug line-clamp-2">
            {video.title}
          </h3>
          <p className={`text-xs mt-1 ${waitingApproval ? "text-amber-300" : "text-wp-on-surface-variant text-wp-tertiary"}`}>
            {waitingApproval ? "Waiting for admin moderation" : "Generating HLS & AI Summary"}
          </p>
        </div>
      </div>
    </div>
  );
}

function FailedVideoCard({ video }: { video: Video }) {
  return (
    <div className="block max-w-full opacity-60">
      <div className="relative aspect-video rounded-wp-lg overflow-hidden bg-red-900/10 border border-red-500/20 mb-3 flex flex-col items-center justify-center gap-2 text-red-400">
         <AlertCircle size={32} />
         <p className="text-xs font-semibold">Processing Failed</p>
      </div>
      <div className="flex gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-wp-on-surface leading-snug line-clamp-2 line-through">
            {video.title}
          </h3>
          <p className="text-xs text-red-400 mt-1">
            Please delete and re-upload.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-wp-on-surface-variant
      bg-wp-surface-container-low rounded-wp-xl border border-dashed border-wp-outline/30">
      <VideoIcon size={40} className="mb-3 opacity-30" />
      <p className="text-sm">You haven't uploaded any videos yet.</p>
      <Link to="/upload" className="mt-4 text-sm text-wp-primary font-medium hover:underline">
         Upload your first video
      </Link>
    </div>
  );
}
