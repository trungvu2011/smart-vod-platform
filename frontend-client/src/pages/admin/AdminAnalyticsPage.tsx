import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import type { AnalyticsMetrics, DashboardMetrics } from '../../api/adminApi';

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [a, d] = await Promise.all([
        adminApi.getAnalyticsMetrics(),
        adminApi.getDashboardMetrics(),
      ]);
      setMetrics(a);
      setDashboard(d);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000); // Auto-refresh 15s
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const { transcodingJobs, systemHealth, videosByCategory, viewsTimeline, storageEstimate } = metrics || {};
  const maxTimelineCount = Math.max(...(viewsTimeline?.map(d => d.count) || [1]), 1);

  const healthColor = (status: string) => {
    if (status === 'OPERATIONAL') return 'text-emerald-500';
    if (status === 'DOWN') return 'text-red-500';
    return 'text-amber-500';
  };

  const healthBg = (status: string) => {
    if (status === 'OPERATIONAL') return 'bg-emerald-500';
    if (status === 'DOWN') return 'bg-red-500';
    return 'bg-amber-500';
  };

  const allOperational = systemHealth?.database === 'OPERATIONAL' && systemHealth?.redis === 'OPERATIONAL' && systemHealth?.queue === 'OPERATIONAL';

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 animate-fade-in relative">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-wp-on-surface mb-2">Infrastructure</h1>
          <p className="text-wp-on-surface-variant text-lg">System health and processing analytics across services.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-wp-surface-container-high px-6 py-3 rounded-xl border border-wp-outline-variant/10">
            <span className="text-sm font-bold tracking-wide text-wp-on-surface-variant block mb-1 uppercase">System Status</span>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${allOperational ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></span>
              <span className={`font-bold ${allOperational ? 'text-emerald-500' : 'text-amber-500'}`}>
                {allOperational ? 'ALL OPERATIONAL' : 'DEGRADED'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* System Health Cards */}
      <section>
        <h2 className="text-2xl font-bold text-wp-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-wp-primary">monitor_heart</span>
          Service Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PostgreSQL */}
          <div className="bg-wp-surface-container-low rounded-2xl p-6 border border-wp-outline-variant/5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-wp-primary text-2xl">database</span>
                <div>
                  <p className="font-bold text-wp-on-surface">PostgreSQL</p>
                  <p className="text-xs text-wp-on-surface-variant">Primary Database</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${healthBg(systemHealth?.database || 'UNKNOWN')}`}></span>
                <span className={`text-xs font-bold uppercase ${healthColor(systemHealth?.database || 'UNKNOWN')}`}>
                  {systemHealth?.database || 'UNKNOWN'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-wp-on-surface-variant">Total Users</p>
                <p className="text-xl font-bold text-wp-on-surface">{dashboard?.users.total || 0}</p>
              </div>
              <div>
                <p className="text-xs text-wp-on-surface-variant">Total Videos</p>
                <p className="text-xl font-bold text-wp-on-surface">{dashboard?.videos.total || 0}</p>
              </div>
            </div>
          </div>

          {/* Redis */}
          <div className="bg-wp-surface-container-low rounded-2xl p-6 border border-wp-outline-variant/5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-400 text-2xl">memory</span>
                <div>
                  <p className="font-bold text-wp-on-surface">Redis</p>
                  <p className="text-xs text-wp-on-surface-variant">Cache & Sessions</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${healthBg(systemHealth?.redis || 'UNKNOWN')}`}></span>
                <span className={`text-xs font-bold uppercase ${healthColor(systemHealth?.redis || 'UNKNOWN')}`}>
                  {systemHealth?.redis || 'UNKNOWN'}
                </span>
              </div>
            </div>
            <p className="text-xs text-wp-on-surface-variant mt-4">View throttling • Session management • Queue backend</p>
          </div>

          {/* BullMQ */}
          <div className="bg-wp-surface-container-low rounded-2xl p-6 border border-wp-outline-variant/5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-wp-tertiary text-2xl">queue</span>
                <div>
                  <p className="font-bold text-wp-on-surface">BullMQ</p>
                  <p className="text-xs text-wp-on-surface-variant">Job Queue</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${healthBg(systemHealth?.queue || 'UNKNOWN')}`}></span>
                <span className={`text-xs font-bold uppercase ${healthColor(systemHealth?.queue || 'UNKNOWN')}`}>
                  {systemHealth?.queue || 'UNKNOWN'}
                </span>
              </div>
            </div>
            {systemHealth?.queueCounts && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <p className="text-xs text-wp-on-surface-variant">Active</p>
                  <p className="text-lg font-bold text-wp-primary">{systemHealth.queueCounts.active}</p>
                </div>
                <div>
                  <p className="text-xs text-wp-on-surface-variant">Waiting</p>
                  <p className="text-lg font-bold text-amber-500">{systemHealth.queueCounts.waiting}</p>
                </div>
                <div>
                  <p className="text-xs text-wp-on-surface-variant">Completed</p>
                  <p className="text-lg font-bold text-emerald-500">{systemHealth.queueCounts.completed}</p>
                </div>
                <div>
                  <p className="text-xs text-wp-on-surface-variant">Failed</p>
                  <p className="text-lg font-bold text-red-400">{systemHealth.queueCounts.failed}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Views Timeline + Storage */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Views Timeline */}
        <div className="lg:col-span-2 bg-wp-surface-container-low rounded-2xl p-8 border border-wp-outline-variant/5">
          <h3 className="text-xl font-bold text-wp-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-wp-primary">trending_up</span>
            Views — Last 7 Days
          </h3>
          <div className="flex items-end gap-3 h-48">
            {viewsTimeline?.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-wp-on-surface">{d.count}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-wp-primary to-wp-primary-container transition-all hover:brightness-110"
                  style={{ height: `${Math.max((d.count / maxTimelineCount) * 100, 4)}%` }}
                />
                <span className="text-[10px] text-wp-on-surface-variant font-medium">
                  {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
          {(!viewsTimeline || viewsTimeline.length === 0) && (
            <p className="text-center text-wp-on-surface-variant py-8">No view data available.</p>
          )}
        </div>

        {/* Storage Estimate */}
        <div className="bg-wp-surface-container-low rounded-2xl p-8 border border-wp-outline-variant/5 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[140px]">cloud_circle</span>
          </div>
          <h3 className="text-xl font-bold text-wp-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-wp-tertiary">storage</span>
            Storage
          </h3>
          <div className="space-y-6 relative z-10">
            <div>
              <p className="text-xs text-wp-on-surface-variant mb-1">Total Videos</p>
              <p className="text-4xl font-black text-wp-on-surface">{storageEstimate?.totalVideos || 0}</p>
            </div>
            <div>
              <p className="text-xs text-wp-on-surface-variant mb-1">Processed (HLS Ready)</p>
              <p className="text-2xl font-bold text-emerald-500">{storageEstimate?.processedVideos || 0}</p>
            </div>
            {storageEstimate && storageEstimate.totalVideos > 0 && (
              <div>
                <div className="flex justify-between text-xs text-wp-on-surface-variant mb-1">
                  <span>Processing rate</span>
                  <span className="font-bold text-wp-on-surface">{Math.round((storageEstimate.processedVideos / storageEstimate.totalVideos) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 bg-wp-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-wp-primary rounded-full transition-all"
                    style={{ width: `${(storageEstimate.processedVideos / storageEstimate.totalVideos) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom: Transcoding Pipeline + Video Distribution */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transcoding Pipeline */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-wp-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-wp-primary">history_edu</span>
            HLS Transcoding Pipeline
          </h3>
          <div className="bg-wp-surface-container-low rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead className="bg-wp-surface-container-high">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-wp-on-surface-variant uppercase tracking-widest">Job ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-wp-on-surface-variant uppercase tracking-widest">Source</th>
                  <th className="px-6 py-4 text-xs font-bold text-wp-on-surface-variant uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-wp-on-surface-variant uppercase tracking-widest text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wp-outline-variant/10">
                {transcodingJobs && transcodingJobs.length > 0 ? transcodingJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-wp-surface-container-highest transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-wp-on-surface">{job.id?.slice(0, 8) || '—'}…</td>
                    <td className="px-6 py-4 text-sm font-medium text-wp-on-surface truncate max-w-[200px]">{job.source}</td>
                    <td className="px-6 py-4">
                      {job.status === 'PROCESSING' ? (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black rounded uppercase">Processing</span>
                      ) : job.status === 'COMPLETE' ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black rounded uppercase">Complete</span>
                      ) : job.status === 'WAITING' ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black rounded uppercase">Waiting</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black rounded uppercase">{job.status}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {job.status === 'PROCESSING' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-20 h-1.5 bg-wp-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-wp-primary animate-pulse" style={{ width: `${job.progress}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-wp-primary">{job.progress}%</span>
                        </div>
                      ) : job.status === 'COMPLETE' ? (
                        <span className="text-xs text-emerald-500 font-bold">100%</span>
                      ) : (
                        <span className="text-xs text-wp-on-surface-variant">—</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-wp-on-surface-variant">No transcoding jobs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Video Distribution */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-wp-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-wp-tertiary">pie_chart</span>
            Content Distribution
          </h3>

          {/* By Category */}
          <div className="bg-wp-surface-container-low rounded-2xl p-6 border border-wp-outline-variant/5">
            <h4 className="text-sm font-bold text-wp-on-surface-variant mb-4 uppercase tracking-widest">By Category</h4>
            <div className="space-y-3">
              {videosByCategory && videosByCategory.length > 0 ? videosByCategory.map((cat) => {
                const maxCount = Math.max(...videosByCategory.map(c => c.count), 1);
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-wp-on-surface font-medium">{cat.category}</span>
                      <span className="text-wp-on-surface-variant">{cat.count} videos • {cat.totalViews.toLocaleString()} views</span>
                    </div>
                    <div className="w-full h-2 bg-wp-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-wp-primary to-wp-tertiary rounded-full transition-all"
                        style={{ width: `${(cat.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-wp-on-surface-variant">No category data available.</p>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-wp-primary/10 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
    </div>
  );
}
