import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../../api/adminApi";
import type { DashboardMetrics } from "../../api/adminApi";
import { Link } from "react-router-dom";
import UserAvatar from "../../components/ui/UserAvatar";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await adminApi.getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to load dashboard data.", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const m = metrics;
  const maxGrowth = Math.max(...(m?.userGrowth?.map(d => d.count) || [1]), 1);
  const maxVideoGrowth = Math.max(...(m?.videoGrowth?.map(d => d.count) || [1]), 1);

  const videoStatusData = m ? [
    { label: 'Ready', count: m.videos.ready, color: 'bg-emerald-500' },
    { label: 'Pending', count: m.videos.pending, color: 'bg-amber-500' },
    { label: 'Processing', count: m.videos.processing, color: 'bg-blue-500' },
    { label: 'Failed', count: m.videos.failed, color: 'bg-red-500' },
    { label: 'Banned', count: m.videos.banned, color: 'bg-gray-500' },
  ] : [];

  const totalStatusCount = videoStatusData.reduce((a, b) => a + b.count, 0) || 1;

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8 animate-fade-in">
      {/* Header */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-wp-on-surface">System Performance</h2>
            <p className="text-wp-on-surface-variant/60 text-sm">Real-time health and engagement metrics across clusters.</p>
          </div>
          <span className="text-xs font-medium text-wp-primary bg-wp-primary/10 px-3 py-1 rounded-full border border-wp-primary/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-wp-primary animate-pulse"></span>
            LIVE DATA
          </span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Users */}
          <div className="glass-panel p-6 rounded-xl border-l-4 border-wp-primary">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-wp-primary" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              <span className="text-xs font-bold text-emerald-500">+{m?.userGrowth?.reduce((a, b) => a + b.count, 0) || 0} this week</span>
            </div>
            <h4 className="text-xs font-black text-wp-on-surface-variant/40 uppercase tracking-widest mb-1">Total Users</h4>
            <div className="text-3xl font-black text-wp-on-surface">{m?.users.total || 0}</div>
            <div className="flex items-end gap-[3px] mt-3 h-8">
              {m?.userGrowth?.map((d, i) => (
                <div key={i} className="flex-1 bg-wp-primary/30 rounded-t-sm transition-all hover:bg-wp-primary/50"
                  style={{ height: `${Math.max((d.count / maxGrowth) * 100, 8)}%` }}
                  title={`${d.date}: ${d.count}`}
                />
              ))}
            </div>
          </div>

          {/* Total Videos */}
          <div className="glass-panel p-6 rounded-xl border-l-4 border-wp-tertiary">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-wp-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
              <span className="text-xs font-bold text-emerald-500">+{m?.videoGrowth?.reduce((a, b) => a + b.count, 0) || 0} this week</span>
            </div>
            <h4 className="text-xs font-black text-wp-on-surface-variant/40 uppercase tracking-widest mb-1">Total Videos</h4>
            <div className="text-3xl font-black text-wp-on-surface">{m?.videos.total || 0}</div>
            <div className="flex items-end gap-[3px] mt-3 h-8">
              {m?.videoGrowth?.map((d, i) => (
                <div key={i} className="flex-1 bg-wp-tertiary/30 rounded-t-sm transition-all hover:bg-wp-tertiary/50"
                  style={{ height: `${Math.max((d.count / maxVideoGrowth) * 100, 8)}%` }}
                  title={`${d.date}: ${d.count}`}
                />
              ))}
            </div>
          </div>

          {/* Total Views */}
          <div className="glass-panel p-6 rounded-xl border-l-4 border-emerald-500">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
            </div>
            <h4 className="text-xs font-black text-wp-on-surface-variant/40 uppercase tracking-widest mb-1">Total Views</h4>
            <div className="text-3xl font-black text-wp-on-surface">{(m?.totalViews || 0).toLocaleString()}</div>
            <div className="flex gap-4 mt-3 text-xs text-wp-on-surface-variant">
              <span><strong className="text-wp-on-surface">{m?.totalComments || 0}</strong> comments</span>
              <span><strong className="text-wp-on-surface">{m?.totalLikes || 0}</strong> likes</span>
            </div>
          </div>

          {/* Pending Approvals */}
          <Link to="/admin/moderation" className="glass-panel p-6 rounded-xl border-l-4 border-amber-500 hover:bg-wp-surface-bright transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
              {(m?.videos.pending || 0) > 0 && (
                <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
              )}
            </div>
            <h4 className="text-xs font-black text-wp-on-surface-variant/40 uppercase tracking-widest mb-1">Pending Review</h4>
            <div className="text-3xl font-black text-wp-on-surface">{m?.videos.pending || 0}</div>
            <p className="text-xs text-wp-primary font-bold mt-3 group-hover:underline">Review queue →</p>
          </Link>
        </div>
      </section>

      {/* Video Status Distribution + Top Videos */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Status Distribution */}
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold text-wp-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-wp-primary text-[20px]">donut_large</span>
            Video Distribution
          </h3>
          {/* Horizontal stacked bar */}
          <div className="w-full h-4 rounded-full overflow-hidden flex mb-6">
            {videoStatusData.map((s) => (
              <div key={s.label} className={`${s.color} transition-all`}
                style={{ width: `${(s.count / totalStatusCount) * 100}%` }}
                title={`${s.label}: ${s.count}`}
              />
            ))}
          </div>
          <div className="space-y-3">
            {videoStatusData.map((s) => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.color}`}></div>
                  <span className="text-wp-on-surface-variant">{s.label}</span>
                </div>
                <span className="font-bold text-wp-on-surface">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Videos */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-wp-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-wp-tertiary text-[20px]">trending_up</span>
              Top Videos by Views
            </h3>
          </div>
          <div className="space-y-3">
            {m?.topVideos?.map((video, i) => (
              <div key={video.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-wp-surface-container-high/40 transition-colors">
                <span className={`text-lg font-black w-8 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-wp-on-surface-variant/30'}`}>
                  #{i + 1}
                </span>
                <div className="w-16 h-10 rounded-lg bg-wp-surface-lowest overflow-hidden shrink-0">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-wp-outline text-sm">movie</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-wp-on-surface truncate">{video.title}</p>
                  <p className="text-[11px] text-wp-on-surface-variant/50">{video.creator.fullName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-wp-on-surface">{video.viewCount.toLocaleString()}</p>
                  <p className="text-[10px] text-wp-on-surface-variant/50">views</p>
                </div>
              </div>
            ))}
            {(!m?.topVideos || m.topVideos.length === 0) && (
              <p className="text-center text-wp-on-surface-variant py-4">No videos yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Recent Uploads + Top Creators */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Uploads */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-wp-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-wp-primary">upload</span>
              Recent Uploads
            </h3>
            <Link to="/admin/moderation" className="text-wp-primary text-sm font-bold hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {m?.recentUploads?.map((video) => (
              <div key={video.id} className="glass-panel p-4 rounded-xl flex gap-4 hover:bg-wp-surface-bright transition-all">
                <div className="w-24 h-14 rounded-lg bg-wp-surface-lowest overflow-hidden shrink-0">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-wp-surface-container-highest">
                      <span className="material-symbols-outlined text-wp-outline text-xl">movie</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate text-wp-on-surface">{video.title}</h4>
                  <p className="text-xs text-wp-on-surface-variant/60">
                    {video.creator?.fullName || "Unknown"} • {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex flex-col justify-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    video.status === 'READY' ? 'bg-emerald-500/10 text-emerald-500' :
                    video.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                    video.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>{video.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Creators */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-wp-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-wp-tertiary">star</span>
            Top Creators
          </h3>
          <div className="glass-panel rounded-xl overflow-hidden">
            {m?.topCreators?.map((creator, i) => (
              <div key={creator.id} className="flex items-center gap-3 p-4 border-b border-wp-outline-variant/5 last:border-0 hover:bg-wp-surface-container-high/30 transition-colors">
                <span className="text-sm font-black text-wp-on-surface-variant/30 w-6 text-center">{i + 1}</span>
                <UserAvatar
                  src={creator.avatarUrl}
                  name={creator.fullName}
                  className="w-8 h-8"
                  initialClassName="text-xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-wp-on-surface truncate">{creator.fullName}</p>
                  <p className="text-[11px] text-wp-on-surface-variant/50">{creator.department || 'No Dept'}</p>
                </div>
                <span className="text-xs font-bold text-wp-primary bg-wp-primary/10 px-2 py-0.5 rounded-full">
                  {creator._count.videos} videos
                </span>
              </div>
            ))}
            {(!m?.topCreators || m.topCreators.length === 0) && (
              <p className="text-center text-wp-on-surface-variant py-6">No creators yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Quick Navigation FAB */}
      <Link to="/admin/users"
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-wp-primary to-wp-primary-container rounded-full shadow-2xl flex items-center justify-center text-wp-on-primary hover:scale-110 active:scale-95 transition-all z-30 group"
      >
        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">add</span>
      </Link>
    </div>
  );
}
