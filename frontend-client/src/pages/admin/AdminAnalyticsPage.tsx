import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import type { AnalyticsMetrics, DashboardMetrics } from '../../api/adminApi';

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
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
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const { transcodingJobs, whisperHealth } = metrics || {};
  const storageUsed = dashboard?.storageUsedTB || 74.2;
  const storageTotal = dashboard?.storageTotalTB || 100;
  const storagePercent = (storageUsed / storageTotal) * 100;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-12 animate-fade-in relative">
      {/* Header Section */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-wp-on-surface mb-2">Infrastructure</h1>
          <p className="text-wp-on-surface-variant text-lg">System health and processing analytics across global clusters.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-wp-surface-container-high px-6 py-3 rounded-xl border border-wp-outline-variant/10">
            <span className="text-sm font-bold tracking-wide text-wp-on-surface-variant block mb-1 uppercase">Global Health</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="font-bold text-emerald-500">OPERATIONAL</span>
            </div>
          </div>
        </div>
      </header>

      {/* Grid: Storage & Metrics */}
      <div className="grid grid-cols-12 gap-6">
        {/* MinIO Storage Card */}
        <div className="col-span-12 lg:col-span-8 bg-wp-surface-container-low rounded-2xl overflow-hidden p-8 flex flex-col justify-between relative group">
          <div className="absolute top-0 right-0 p-8">
            <span className="material-symbols-outlined text-wp-primary/20 text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>database</span>
          </div>
          <div className="relative z-10">
            <span className="text-wp-primary font-bold tracking-widest text-xs uppercase mb-4 block">Primary Storage Cluster</span>
            <h3 className="text-3xl font-bold mb-8 text-wp-on-surface">MinIO S3 Node Alpha</h3>
            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-6xl font-black text-wp-on-surface">{storageUsed}</span>
              <span className="text-2xl font-medium text-wp-on-surface-variant">/ {storageTotal} TB USED</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-3 bg-wp-surface-container-highest rounded-full overflow-hidden mb-8">
              <div 
                className="h-full bg-gradient-to-r from-wp-primary to-wp-primary-container shadow-[0_0_12px_rgba(0,82,255,0.8)] transition-all duration-1000"
                style={{ width: `${storagePercent}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-wp-on-surface-variant text-sm mb-1">Object Count</p>
                <p className="text-xl font-bold text-wp-on-surface">12.4M</p>
              </div>
              <div>
                <p className="text-wp-on-surface-variant text-sm mb-1">Weekly Growth</p>
                <p className="text-xl font-bold text-emerald-400">+1.2 TB</p>
              </div>
              <div>
                <p className="text-wp-on-surface-variant text-sm mb-1">Redundancy</p>
                <p className="text-xl font-bold text-wp-on-surface">Erasure Code 4:2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Small Secondary Metric Cards */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 bg-wp-surface-container-high rounded-2xl p-6 border border-wp-outline-variant/5">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-wp-tertiary">speed</span>
              <span className="text-xs font-bold text-wp-tertiary px-2 py-1 bg-wp-tertiary/10 rounded-full">ACTIVE</span>
            </div>
            <p className="text-wp-on-surface-variant text-sm font-medium">Egress Bandwidth</p>
            <p className="text-3xl font-black mt-2 text-wp-on-surface">4.8 Gbps</p>
            <div className="mt-4 flex items-end gap-1 h-12">
              <div className="w-full bg-wp-tertiary/20 h-4 rounded-t-sm"></div>
              <div className="w-full bg-wp-tertiary/30 h-8 rounded-t-sm"></div>
              <div className="w-full bg-wp-tertiary/40 h-6 rounded-t-sm"></div>
              <div className="w-full bg-wp-tertiary/60 h-10 rounded-t-sm"></div>
              <div className="w-full bg-wp-tertiary/80 h-12 rounded-t-sm"></div>
              <div className="w-full bg-wp-primary h-9 rounded-t-sm"></div>
            </div>
          </div>
          <div className="flex-1 bg-wp-surface-container-high rounded-2xl p-6 border border-wp-outline-variant/5">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-wp-primary text-[28px]">memory</span>
              <span className="text-xs font-bold text-wp-primary px-2 py-1 bg-wp-primary/10 rounded-full">92% LOAD</span>
            </div>
            <p className="text-wp-on-surface-variant text-sm font-medium">Whisper AI Compute</p>
            <p className="text-3xl font-black mt-2 text-wp-on-surface">128 NVIDIA H100s</p>
            <p className="text-xs text-wp-on-surface-variant/60 mt-2">Queue time: {whisperHealth?.latencyMs || 0}ms avg</p>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-wp-on-surface">Departmental Velocity</h2>
            <p className="text-wp-on-surface-variant">Training completion heatmap across organizational units.</p>
          </div>
          <div className="flex gap-2 items-center bg-wp-surface-lowest p-2 rounded-xl">
            <div className="w-4 h-4 bg-wp-surface-container-highest rounded"></div>
            <span className="text-xs text-wp-on-surface-variant mr-4">0%</span>
            <div className="w-4 h-4 bg-wp-primary/40 rounded"></div>
            <div className="w-4 h-4 bg-wp-primary/70 rounded"></div>
            <div className="w-4 h-4 bg-wp-primary rounded"></div>
            <span className="text-xs text-wp-on-surface-variant">100%</span>
          </div>
        </div>
        <div className="bg-wp-surface-container-low rounded-3xl p-8 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <div className="min-w-[1024px]">
            {/* Department Labels & Grid */}
            <div className="grid grid-cols-13 gap-4 pb-4">
              <div className="col-span-1"></div> {/* Spacer for row labels */}
              <div className="col-span-12 grid grid-cols-12 gap-2 text-center text-[10px] font-bold text-wp-on-surface-variant uppercase tracking-widest pl-2">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
              </div>

              {/* Engineering Row */}
              <div className="col-span-1 flex items-center justify-end text-sm font-bold text-wp-on-surface-variant pr-4">Engineering</div>
              <div className="col-span-12 grid grid-cols-12 gap-2">
                <div className="aspect-square bg-wp-primary rounded-lg opacity-80 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer text-wp-surface-lowest font-bold text-xs flex justify-center items-center shadow-[0_0_8px_rgba(183,196,255,0.4)]">100</div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-90 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-surface-container-highest rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-70 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-50 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-95 transition-transform hover:scale-110 cursor-pointer"></div>
              </div>

              {/* Design Row */}
              <div className="col-span-1 flex items-center justify-end text-sm font-bold text-wp-on-surface-variant pr-4">Design</div>
              <div className="col-span-12 grid grid-cols-12 gap-2">
                <div className="aspect-square bg-wp-primary rounded-lg opacity-40 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-30 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-60 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-80 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-90 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-surface-container-highest rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-70 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
              </div>

              {/* Operations Row */}
              <div className="col-span-1 flex items-center justify-end text-sm font-bold text-wp-on-surface-variant pr-4">Operations</div>
              <div className="col-span-12 grid grid-cols-12 gap-2">
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-90 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-80 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer text-wp-surface-lowest font-bold text-xs flex justify-center items-center">98</div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-95 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg opacity-90 transition-transform hover:scale-110 cursor-pointer"></div>
                <div className="aspect-square bg-wp-primary rounded-lg transition-transform hover:scale-110 cursor-pointer"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Logs & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Processing Jobs */}
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
                  <th className="px-6 py-4 text-xs font-bold text-wp-on-surface-variant uppercase tracking-widest text-right">Bitrate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wp-outline-variant/10">
                {transcodingJobs?.map((job) => (
                  <tr key={job.id} className="hover:bg-wp-surface-container-highest transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-wp-on-surface">{job.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-wp-on-surface">{job.source}</td>
                    <td className="px-6 py-4">
                      {job.status === 'PROCESSING' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-wp-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-wp-primary animate-[pulse_1s_ease-in-out_infinite]" style={{ width: `${job.progress}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-wp-primary">{job.progress}%</span>
                        </div>
                      ) : job.status === 'COMPLETE' ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black rounded uppercase">Complete</span>
                      ) : (
                         <span className="px-2 py-0.5 bg-wp-error/10 text-wp-error border border-wp-error/20 text-[10px] font-black rounded uppercase">{job.status}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-wp-on-surface-variant">{job.bitrate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Whisper Health */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-wp-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-wp-tertiary">graphic_eq</span>
            Whisper AI Transcription Health
          </h3>
          <div className="bg-wp-surface-container-low rounded-3xl p-8 border border-wp-outline-variant/10 relative overflow-hidden shadow-xl">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-wp-tertiary/10 blur-[100px] pointer-events-none"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-wp-on-surface-variant font-medium">Transcription Accuracy (v3-large)</span>
                <span className="text-2xl font-black text-wp-on-surface">{whisperHealth?.accuracy || 0}%</span>
              </div>
              <div className="space-y-4">
                <div className="bg-wp-surface-lowest p-4 rounded-xl flex items-center gap-4 border border-wp-outline-variant/5">
                  <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-wp-on-surface">Inference Engine Stable</p>
                    <p className="text-[11px] text-wp-on-surface-variant">All 12 nodes reporting nominal latency.</p>
                  </div>
                  <span className="text-[10px] text-wp-on-surface-variant font-mono">{whisperHealth?.latencyMs || 0}ms ping</span>
                </div>
                <div className="bg-wp-surface-lowest p-4 rounded-xl flex items-center gap-4 border border-wp-outline-variant/5">
                  <span className="material-symbols-outlined text-wp-primary">translate</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-wp-on-surface">Language Auto-Detect</p>
                    <p className="text-[11px] text-wp-on-surface-variant">{whisperHealth?.languagesSupported || 0} languages supported in current model.</p>
                  </div>
                  <span className="text-[10px] text-wp-on-surface-variant font-mono">Active</span>
                </div>
              </div>
              {/* Live Terminal Stream (Visual Only) */}
              <div className="bg-[#040914] rounded-xl p-4 font-mono text-[11px] text-emerald-400/60 leading-relaxed border border-wp-outline-variant/5 shadow-inner">
                <p><span className="text-wp-on-surface-variant">[2023-10-27 14:02:11]</span> <span className="text-wp-tertiary">INFO</span>: Task transcription-552 started</p>
                <p><span className="text-wp-on-surface-variant">[2023-10-27 14:02:14]</span> <span className="text-wp-tertiary">INFO</span>: Decoder initialized on GPU:0</p>
                <p className="text-wp-primary/80"><span className="text-wp-on-surface-variant">[2023-10-27 14:02:18]</span> <span className="text-wp-primary font-bold">BUSY</span>: Processing audio chunk (12/104)...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-wp-primary/10 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
    </div>
  );
}
