import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import type {
  AnalyticsMetrics,
  HealthStatus,
  SystemServiceHealth,
} from '../../api/adminApi';

const serviceEntries = [
  ['api', 'api'],
  ['database', 'storage'],
  ['redis', 'memory'],
  ['queue', 'queue'],
  ['worker', 'precision_manufacturing'],
  ['minio', 'cloud'],
  ['elasticsearch', 'manage_search'],
  ['livekit', 'videocam'],
] as const;

const queueKeys = ['active', 'waiting', 'completed', 'failed', 'delayed'] as const;

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const analyticsMetrics = await adminApi.getAnalyticsMetrics();
      setMetrics(analyticsMetrics);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin" />
      </div>
    );
  }

  const {
    transcodingJobs,
    systemHealth,
    videosByCategory,
    viewsTimeline,
    storageEstimate,
  } = metrics || {};
  const maxTimelineCount = Math.max(...(viewsTimeline?.map((day) => day.count) || [1]), 1);
  const overallStatus = systemHealth?.overallStatus || 'UNKNOWN';
  const allOperational = overallStatus === 'OPERATIONAL';
  const host = systemHealth?.host;
  const queueCounts = systemHealth?.queueCounts;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 animate-fade-in relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-wp-on-surface mb-2">Infrastructure</h1>
          <p className="text-wp-on-surface-variant text-lg">System health and processing analytics across services.</p>
        </div>
        <div className="bg-wp-surface-container-high px-6 py-3 rounded-xl border border-wp-outline-variant/10">
          <span className="text-sm font-bold tracking-wide text-wp-on-surface-variant block mb-1 uppercase">System Status</span>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${allOperational ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : `${healthBg(overallStatus)} animate-pulse`}`} />
            <span className={`font-bold ${healthColor(overallStatus)}`}>
              {allOperational ? 'ALL OPERATIONAL' : overallStatus}
            </span>
          </div>
          {systemHealth?.checkedAt && (
            <p className="text-[11px] text-wp-on-surface-variant mt-1">
              Last checked {new Date(systemHealth.checkedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </header>

      {systemHealth?.alerts && systemHealth.alerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-wrap gap-3">
          {systemHealth.alerts.map((alert, index) => (
            <span
              key={`${alert.message}-${index}`}
              className={alert.level === 'critical' ? 'text-red-400 text-sm font-bold' : 'text-amber-400 text-sm font-bold'}
            >
              {alert.message}
            </span>
          ))}
        </div>
      )}

      <section>
        <h2 className="text-2xl font-bold text-wp-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-wp-primary">monitor_heart</span>
          Server Status
        </h2>

        {host?.status === 'UNKNOWN' && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-400">
            {host.unavailableReason || 'Host metrics unavailable in this environment.'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon="speed"
            label="CPU"
            value={host?.cpu?.usedPercent === null || host?.cpu?.usedPercent === undefined ? 'Warming up' : `${host.cpu.usedPercent}%`}
            percent={metricPercent(host?.cpu?.usedPercent)}
          />
          <MetricCard
            icon="memory"
            label="Memory"
            value={host?.memory ? `${host.memory.usedMb} / ${host.memory.totalMb} MB` : 'Unavailable'}
            percent={metricPercent(host?.memory?.usedPercent)}
          />
          <MetricCard
            icon="hard_drive"
            label="Disk"
            value={host?.disk?.usedPercent !== undefined ? `${host.disk.usedGb} / ${host.disk.totalGb} GB` : 'Unavailable'}
            percent={metricPercent(host?.disk?.usedPercent)}
          />
          <MetricCard
            icon="schedule"
            label="Uptime"
            value={formatUptime(host?.uptimeSeconds)}
            subValue={host?.loadAverage ? `Load ${host.loadAverage.map((value) => value.toFixed(2)).join(' / ')}` : undefined}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {serviceEntries.map(([serviceKey, icon]) => {
            const service = systemHealth?.services?.[serviceKey];
            return (
              <div key={serviceKey} className="bg-wp-surface-container-low rounded-2xl p-5 border border-wp-outline-variant/5">
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-wp-primary text-2xl">{icon}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-wp-on-surface truncate">{service?.name || serviceKey}</p>
                      <p className="text-xs text-wp-on-surface-variant truncate">{detailText(service)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${healthBg(service?.status || 'UNKNOWN')}`} />
                    <span className={`text-xs font-bold uppercase ${healthColor(service?.status || 'UNKNOWN')}`}>
                      {service?.status || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-wp-on-surface-variant">
                  <span>Latency</span>
                  <span className="font-bold text-wp-on-surface">{service?.latencyMs ?? '-'} ms</span>
                </div>
              </div>
            );
          })}
        </div>

        {queueCounts && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
            {queueKeys.map((key) => (
              <div key={key} className="bg-wp-surface-container-low rounded-xl p-4 border border-wp-outline-variant/5">
                <p className="text-xs uppercase tracking-widest text-wp-on-surface-variant">{key}</p>
                <p className={`text-2xl font-black mt-1 ${key === 'failed' && (queueCounts.failed || 0) > 0 ? 'text-red-400' : 'text-wp-on-surface'}`}>
                  {queueCounts[key] || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-wp-surface-container-low rounded-2xl p-8 border border-wp-outline-variant/5">
          <h3 className="text-xl font-bold text-wp-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-wp-primary">trending_up</span>
            Views - Last 7 Days
          </h3>
          <div className="flex items-end gap-3 h-48">
            {viewsTimeline?.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-wp-on-surface">{day.count}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-wp-primary to-wp-primary-container transition-all hover:brightness-110"
                  style={{ height: `${Math.max((day.count / maxTimelineCount) * 100, 4)}%` }}
                />
                <span className="text-[10px] text-wp-on-surface-variant font-medium">
                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
          {(!viewsTimeline || viewsTimeline.length === 0) && (
            <p className="text-center text-wp-on-surface-variant py-8">No view data available.</p>
          )}
        </div>

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
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-wp-primary rounded-full transition-all"
                    style={{ width: `${(storageEstimate.processedVideos / storageEstimate.totalVideos) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    <td className="px-6 py-4 font-mono text-sm text-wp-on-surface">{job.id?.slice(0, 8) || '-'}...</td>
                    <td className="px-6 py-4 text-sm font-medium text-wp-on-surface truncate max-w-[200px]">{job.source}</td>
                    <td className="px-6 py-4">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {job.status === 'PROCESSING' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <div className="w-20 h-1.5 bg-wp-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-wp-primary animate-pulse" style={{ width: `${job.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-wp-primary">{job.progress}%</span>
                        </div>
                      ) : job.status === 'COMPLETE' ? (
                        <span className="text-xs text-emerald-500 font-bold">100%</span>
                      ) : (
                        <span className="text-xs text-wp-on-surface-variant">-</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-wp-on-surface-variant">No transcoding jobs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-wp-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-wp-tertiary">pie_chart</span>
            Content Distribution
          </h3>
          <div className="bg-wp-surface-container-low rounded-2xl p-6 border border-wp-outline-variant/5">
            <h4 className="text-sm font-bold text-wp-on-surface-variant mb-4 uppercase tracking-widest">By Category</h4>
            <div className="space-y-3">
              {videosByCategory && videosByCategory.length > 0 ? videosByCategory.map((category) => {
                const maxCount = Math.max(...videosByCategory.map((item) => item.count), 1);
                return (
                  <div key={category.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-wp-on-surface font-medium">{category.category}</span>
                      <span className="text-wp-on-surface-variant">{category.count} videos - {category.totalViews.toLocaleString()} views</span>
                    </div>
                    <div className="w-full h-2 bg-wp-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-wp-primary to-wp-tertiary rounded-full transition-all"
                        style={{ width: `${(category.count / maxCount) * 100}%` }}
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

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-wp-primary/10 rounded-full blur-[150px] -z-10 pointer-events-none" />
    </div>
  );
}

function healthColor(status: HealthStatus | string) {
  if (status === 'OPERATIONAL') return 'text-emerald-500';
  if (status === 'DOWN') return 'text-red-500';
  if (status === 'DEGRADED') return 'text-amber-500';
  if (status === 'DISABLED') return 'text-wp-outline';
  return 'text-amber-500';
}

function healthBg(status: HealthStatus | string) {
  if (status === 'OPERATIONAL') return 'bg-emerald-500';
  if (status === 'DOWN') return 'bg-red-500';
  if (status === 'DEGRADED') return 'bg-amber-500';
  if (status === 'DISABLED') return 'bg-wp-outline';
  return 'bg-amber-500';
}

function formatUptime(seconds?: number) {
  if (!seconds) return 'Unavailable';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function metricPercent(value?: number | null) {
  return typeof value === 'number' ? Math.max(0, Math.min(100, value)) : 0;
}

function detailText(service?: SystemServiceHealth) {
  if (!service) return 'No data reported';
  if (service.message) return service.message;

  const details = service.details || {};
  if (details.queueCounts && typeof details.queueCounts === 'object') {
    const counts = details.queueCounts as { waiting?: number; active?: number };
    return `${counts.active || 0} active - ${counts.waiting || 0} waiting`;
  }
  if (details.bucketReady) return 'Bucket ready';
  if (details.activeRooms !== undefined) return `${Number(details.activeRooms) || 0} active rooms`;
  if (details.enabled === false) return 'Disabled by config';
  if (details.uptimeSeconds) return `Uptime ${formatUptime(Number(details.uptimeSeconds))}`;
  return service.latencyMs !== undefined ? `${service.latencyMs} ms response` : 'Health check completed';
}

function MetricCard({
  icon,
  label,
  value,
  percent = 0,
  subValue,
}: {
  icon: string;
  label: string;
  value: string;
  percent?: number;
  subValue?: string;
}) {
  return (
    <div className="bg-wp-surface-container-low rounded-2xl p-5 border border-wp-outline-variant/5">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-wp-primary">{icon}</span>
        <span className="text-xs uppercase tracking-widest text-wp-on-surface-variant font-bold">{label}</span>
      </div>
      <p className="text-xl font-black text-wp-on-surface truncate">{value}</p>
      {subValue && <p className="text-xs text-wp-on-surface-variant mt-1 truncate">{subValue}</p>}
      {!subValue && (
        <div className="h-2 bg-wp-surface-container-highest rounded-full overflow-hidden mt-4">
          <div
            className={`h-full rounded-full transition-all ${percent >= 85 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-wp-primary'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  if (status === 'PROCESSING') {
    return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black rounded uppercase">Processing</span>;
  }
  if (status === 'COMPLETE') {
    return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black rounded uppercase">Complete</span>;
  }
  if (status === 'WAITING') {
    return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black rounded uppercase">Waiting</span>;
  }
  return <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black rounded uppercase">{status}</span>;
}
