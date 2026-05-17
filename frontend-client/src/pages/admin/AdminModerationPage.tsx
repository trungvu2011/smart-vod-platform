import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../api/adminApi";
import type { Video } from "../../types";
import ConfirmModal from "../../components/ui/ConfirmModal";
import RejectVideoModal from "../../components/ui/RejectVideoModal";
import UserAvatar from "../../components/ui/UserAvatar";
import VideoPlayer from "../../components/video/VideoPlayer";

type TabFilter = "ALL_PENDING" | "PENDING" | "PROCESSING" | "BANNED" | "READY";

export default function AdminModerationPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>("ALL_PENDING");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Modals
  const [approveTarget, setApproveTarget] = useState<Video | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Video | null>(null);
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Video | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      let statusParam: string | undefined;
      if (tab === "ALL_PENDING") statusParam = undefined;
      else statusParam = tab;

      const data = await adminApi.getModerationQueue(statusParam);
      setVideos(data);
      setSelected(new Set());
    } catch (error) {
      console.error("Failed to fetch moderation queue:", error);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const isSelectable = (video: Video) => video.status === "PENDING" || video.status === "PROCESSING";
  const canApprove = (video: Video) => video.status === "PENDING" && Boolean(video.metadata?.hlsMasterUrl);

  const handleApprove = async (videoId: string) => {
    try {
      await adminApi.approveVideo(videoId);
      showToast("Video approved successfully.");
      fetchQueue();
    } catch (error) {
      console.error("Failed to approve:", error);
      showToast("Cannot approve this video yet.");
    } finally {
      setApproveTarget(null);
    }
  };

  const requestApprove = (video: Video) => {
    if (video.status !== "PENDING") {
      showToast("Only pending videos can be approved.");
      return;
    }

    if (!video.metadata?.hlsMasterUrl) {
      showToast("Video is still processing. Please try again shortly.");
      return;
    }

    setApproveTarget(video);
  };

  const handleReject = async (videoId: string, reason: string) => {
    try {
      await adminApi.rejectVideo(videoId, reason);
      showToast("Video rejected.");
      fetchQueue();
    } catch (error) {
      console.error("Failed to reject:", error);
    }
  };

  const handleBulkApprove = async () => {
    const selectedVideos = videos.filter((v) => selected.has(v.id));
    if (selectedVideos.length === 0) return;

    const nonPending = selectedVideos.filter((v) => v.status !== "PENDING");
    if (nonPending.length > 0) {
      showToast("Bulk approve only supports PENDING videos.");
      return;
    }

    const pendingWithoutPreview = selectedVideos.filter((v) => !v.metadata?.hlsMasterUrl);
    if (pendingWithoutPreview.length > 0) {
      showToast("Some selected videos are not ready for preview/approval yet.");
      return;
    }

    try {
      await adminApi.bulkApproveVideos(selectedVideos.map((v) => v.id));
      showToast(`${selectedVideos.length} video(s) approved.`);
      fetchQueue();
    } catch (error) {
      console.error("Bulk approve failed:", error);
    } finally {
      setBulkAction(null);
    }
  };

  const handleBulkReject = async (reason: string) => {
    try {
      await adminApi.bulkRejectVideos(Array.from(selected), reason);
      showToast(`${selected.size} video(s) rejected.`);
      fetchQueue();
    } catch (error) {
      console.error("Bulk reject failed:", error);
    } finally {
      setBulkAction(null);
    }
  };

  const toggleSelect = (video: Video) => {
    if (!isSelectable(video)) return;

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(video.id)) next.delete(video.id);
      else next.add(video.id);
      return next;
    });
  };

  const selectableVideos = videos.filter(isSelectable);
  const selectableIds = selectableVideos.map((v) => v.id);

  const toggleSelectAll = () => {
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(selectableIds));
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const tabs: { key: TabFilter; label: string; icon: string }[] = [
    { key: "ALL_PENDING", label: "Pending", icon: "pending_actions" },
    { key: "PENDING", label: "Pending Only", icon: "hourglass_top" },
    { key: "PROCESSING", label: "Processing", icon: "sync" },
    { key: "READY", label: "Approved", icon: "check_circle" },
    { key: "BANNED", label: "Rejected", icon: "block" },
  ];

  const pendingCount = videos.filter((v) => v.status === "PENDING").length;
  const selectableSelectedCount = selectableIds.filter((id) => selected.has(id)).length;
  const allSelectableChecked =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-fade-in">
      {toast && (
        <div className="fixed top-20 right-8 z-[200] bg-wp-surface-container-high text-wp-on-surface px-6 py-3 rounded-xl shadow-2xl border border-wp-outline-variant/10 text-sm font-medium animate-fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-wp-on-surface mb-2">Content Moderation</h1>
          <p className="text-wp-on-surface-variant max-w-md">Review pending video submissions and ensure compliance with community guidelines.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-wp-surface-container-high px-4 py-2 rounded-xl flex items-center gap-3 border border-wp-outline-variant/10 shadow-sm">
            <span className="text-wp-primary font-bold">{videos.length}</span>
            <span className="text-xs uppercase tracking-widest text-wp-outline font-semibold">Total</span>
          </div>
          {pendingCount > 0 && (
            <div className="bg-amber-500/10 px-4 py-2 rounded-xl flex items-center gap-3 border border-amber-500/20">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              <span className="text-xs uppercase tracking-widest text-amber-500 font-bold">{pendingCount} Pending</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? "bg-wp-primary/10 text-wp-primary border border-wp-primary/20"
                : "text-wp-on-surface-variant hover:bg-wp-surface-container-high border border-transparent"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {selectableSelectedCount > 0 && (
        <div className="glass-panel p-4 rounded-xl mb-6 flex items-center justify-between animate-fade-in">
          <span className="text-sm font-semibold text-wp-on-surface">
            <span className="text-wp-primary font-bold">{selectableSelectedCount}</span> video(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setBulkAction("approve")}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-base mr-1 align-middle">check_circle</span>
              Approve All
            </button>
            <button
              onClick={() => setBulkAction("reject")}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              <span className="material-symbols-outlined text-base mr-1 align-middle">cancel</span>
              Reject All
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-wp-on-surface-variant hover:bg-wp-surface-container-high transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-wp-surface-container-low p-12 rounded-2xl text-center border border-wp-outline-variant/10">
          <span className="material-symbols-outlined text-5xl text-emerald-500 mb-4">verified</span>
          <h3 className="text-xl font-bold text-wp-on-surface mb-2">Queue is empty</h3>
          <p className="text-wp-on-surface-variant">All videos have been reviewed and moderated.</p>
        </div>
      ) : (
        <>
          {selectableIds.length > 0 && (
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-wp-on-surface-variant cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSelectableChecked}
                  onChange={toggleSelectAll}
                  className="rounded border-wp-outline-variant bg-wp-surface-lowest text-wp-primary focus:ring-wp-primary/20 w-4 h-4"
                />
                Select actionable ({selectableIds.length})
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className={`group bg-wp-surface-container-low rounded-2xl overflow-hidden hover:scale-[1.01] transition-all duration-300 shadow-wp-card border ${
                  selected.has(video.id)
                    ? "border-wp-primary/40 ring-1 ring-wp-primary/20"
                    : "border-wp-outline-variant/10"
                } flex flex-col`}
              >
                <div className="relative aspect-video overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-wp-surface-container-highest flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-wp-outline">movie</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-wp-surface-container-low via-transparent to-transparent opacity-80" />

                  <div
                    className={`absolute top-4 left-4 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm ${
                      video.status === "PENDING"
                        ? "bg-amber-500/80 text-white"
                        : video.status === "PROCESSING"
                          ? "bg-blue-500/80 text-white"
                          : video.status === "READY"
                            ? "bg-emerald-500/80 text-white"
                            : "bg-red-500/80 text-white"
                    }`}
                  >
                    {video.status}
                  </div>

                  {isSelectable(video) && (
                    <div className="absolute top-4 right-4">
                      <input
                        type="checkbox"
                        checked={selected.has(video.id)}
                        onChange={() => toggleSelect(video)}
                        className="w-5 h-5 rounded border-white/50 bg-black/30 text-wp-primary focus:ring-wp-primary/20 cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-medium">
                      {formatDuration(video.metadata?.duration)}
                    </span>
                    <span className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-medium">
                      {video.visibility}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-wp-on-surface leading-tight mb-2">{video.title}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <UserAvatar
                        src={video.creator?.avatarUrl}
                        name={video.creator?.fullName || "Unknown"}
                        className="w-5 h-5 border border-wp-outline-variant/20"
                        initialClassName="text-[8px]"
                      />
                      <span className="text-xs text-wp-on-surface-variant font-medium">
                        {video.creator?.fullName || "Unknown"} • {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {(video.status === "PENDING" || video.status === "PROCESSING") && (
                    <div className="grid grid-cols-3 gap-3 mt-auto">
                      <button
                        onClick={() =>
                          video.metadata?.hlsMasterUrl
                            ? setPreviewTarget(video)
                            : showToast("Video is still processing. Preview unavailable.")
                        }
                        className={`py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all border border-wp-outline-variant/15 ${
                          video.metadata?.hlsMasterUrl
                            ? "bg-wp-surface-container-high text-wp-on-surface hover:bg-wp-surface-bright"
                            : "bg-wp-surface-container-high/40 text-wp-on-surface-variant cursor-not-allowed"
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">play_circle</span>
                        Preview
                      </button>
                      <button
                        onClick={() => requestApprove(video)}
                        disabled={!canApprove(video)}
                        className="bg-wp-gradient text-wp-on-primary-fixed hover:text-wp-on-primary font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-wp-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectTarget(video)}
                        className="bg-wp-surface-container-high text-wp-on-surface font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-wp-surface-bright active:scale-95 transition-all border border-wp-outline-variant/10"
                      >
                        <span className="material-symbols-outlined text-lg">cancel</span>
                        Reject
                      </button>
                    </div>
                  )}
                  {video.status === "READY" && (
                    <div className="mt-auto pt-2">
                      <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Approved
                      </span>
                    </div>
                  )}
                  {video.status === "BANNED" && (
                    <div className="mt-auto pt-2">
                      <span className="text-xs text-red-400 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">block</span>
                        Rejected
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        open={!!approveTarget}
        title="Approve Video"
        message={`Are you sure you want to approve "${approveTarget?.title}"? It will be published immediately.`}
        confirmText="Approve"
        variant="primary"
        onConfirm={() => approveTarget && handleApprove(approveTarget.id)}
        onCancel={() => setApproveTarget(null)}
      />

      <RejectVideoModal
        open={!!rejectTarget}
        videoTitle={rejectTarget?.title}
        onClose={() => setRejectTarget(null)}
        onReject={(reason) => rejectTarget && handleReject(rejectTarget.id, reason)}
      />

      <ConfirmModal
        open={bulkAction === "approve"}
        title="Bulk Approve Videos"
        message={`Are you sure you want to approve ${selectableSelectedCount} video(s)? They will all be published immediately.`}
        confirmText={`Approve ${selectableSelectedCount} Videos`}
        variant="primary"
        onConfirm={handleBulkApprove}
        onCancel={() => setBulkAction(null)}
      />

      {bulkAction === "reject" && (
        <RejectVideoModal
          open={true}
          videoTitle={`${selectableSelectedCount} selected video(s)`}
          onClose={() => setBulkAction(null)}
          onReject={handleBulkReject}
        />
      )}

      {previewTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-wp-surface-container border border-wp-outline-variant/20 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-wp-outline-variant/10">
              <div>
                <h3 className="text-base font-bold text-wp-on-surface">Video Preview</h3>
                <p className="text-xs text-wp-on-surface-variant mt-0.5">Preview is optional. Use it before making a moderation decision.</p>
              </div>
              <button
                onClick={() => setPreviewTarget(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-wp-on-surface-variant hover:bg-wp-surface-container-high transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-5 space-y-4">
              {previewTarget.metadata?.hlsMasterUrl ? (
                <VideoPlayer
                  src={previewTarget.metadata.hlsMasterUrl}
                  poster={previewTarget.thumbnailUrl || ""}
                  autoPlay
                />
              ) : (
                <div className="aspect-video rounded-xl bg-wp-surface-container-high flex items-center justify-center text-wp-on-surface-variant">
                  Preview unavailable while video is still processing.
                </div>
              )}
              <div className="flex items-center justify-end">
                <button
                  onClick={() => requestApprove(previewTarget)}
                  disabled={!canApprove(previewTarget)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-wp-gradient text-wp-on-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Approve This Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
