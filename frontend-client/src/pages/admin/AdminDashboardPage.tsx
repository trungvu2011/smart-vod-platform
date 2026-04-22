import { useState, useEffect } from "react";
import { adminApi } from "../../api/adminApi";
import type { DashboardMetrics } from "../../api/adminApi";
import type { User, Video } from "../../types";
import { Link } from "react-router-dom";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [moderationQueue, setModerationQueue] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [metricsData, usersData, queueData] = await Promise.all([
          adminApi.getDashboardMetrics(),
          adminApi.getUsers(),
          adminApi.getModerationQueue(),
        ]);
        setMetrics(metricsData);
        setUsers(usersData.slice(0, 5)); // Show recent 5 users
        setModerationQueue(queueData.slice(0, 3)); // Show top 3 pending videos
      } catch (error) {
        console.error("Failed to load dashboard data.", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8 animate-fade-in">
      {/* ── System Analytics Bento Grid ── */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-wp-on-surface">System Performance</h2>
            <p className="text-wp-on-surface-variant/60 text-sm">Real-time health and engagement metrics across clusters.</p>
          </div>
          <span className="text-xs font-medium text-wp-primary bg-wp-primary/10 px-3 py-1 rounded-full border border-wp-primary/20">LIVE DATA</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Storage Card */}
          <div className="md:col-span-2 glass-panel p-6 rounded-xl flex flex-col justify-between overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-sm font-bold text-wp-on-surface-variant flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-wp-primary text-[20px]">storage</span>
                MinIO Storage Cluster
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-wp-on-surface">{metrics?.storageUsedTB || 0}</h3>
                <span className="text-xl text-wp-on-surface-variant/50">/ {metrics?.storageTotalTB || 100} TB USED</span>
              </div>
              <div className="mt-4 w-full bg-wp-surface-lowest h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-wp-primary to-wp-tertiary rounded-full shadow-[0_0_12px_rgba(183,196,255,0.4)]"
                  style={{ width: `${(metrics?.storageUsedTB || 0) / (metrics?.storageTotalTB || 1) * 100}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-wp-on-surface-variant/50 mt-2">Critical threshold: 85TB. Projected overflow in 12 days.</p>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[180px]">cloud_circle</span>
            </div>
          </div>

          {/* Training Completion */}
          <div className="glass-panel p-6 rounded-xl">
            <p className="text-sm font-bold text-wp-on-surface-variant flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-wp-tertiary text-[20px]">school</span>
              Training Completion
            </p>
            <div className="space-y-4">
              {[
                { label: 'Security Ops', value: '92%' },
                { label: 'Cloud Eng', value: '48%' },
                { label: 'DevOps', value: '76%' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-xs">
                  <span className="text-wp-on-surface-variant">{item.label}</span>
                  <span className="text-wp-primary font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="glass-panel p-6 rounded-xl border-l-4 border-wp-primary flex flex-col justify-between">
            <h4 className="text-xs font-black text-wp-on-surface-variant/40 uppercase tracking-widest mb-1">Active Admins</h4>
            <div className="text-3xl font-black text-wp-primary mb-4">{metrics?.activeUsers || 0}</div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-wp-surface-container bg-wp-surface-container-highest"></div>
              <div className="w-8 h-8 rounded-full border-2 border-wp-surface-container bg-wp-surface-container-highest"></div>
              <div className="w-8 h-8 rounded-full border-2 border-wp-surface-container bg-wp-surface-container-highest"></div>
              <div className="w-8 h-8 rounded-full border-2 border-wp-surface-container bg-wp-surface-container-highest flex items-center justify-center text-[10px] font-bold text-wp-on-surface-variant">+{(metrics?.activeUsers || 0)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── User Management Section ── */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-wp-on-surface">User Management</h2>
          <div className="flex gap-3">
            <Link to="/admin/users" className="text-wp-primary text-sm font-bold hover:underline">
              View All Users
            </Link>
          </div>
        </div>

        <div className="bg-wp-surface-container-low rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-wp-surface-container text-wp-on-surface-variant/70 font-semibold border-b border-wp-outline-variant/10">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wp-outline-variant/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-wp-surface-container-high/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-wp-surface-container-highest overflow-hidden">
                        {user.avatarUrl ? (
                          <img alt="Employee" className="w-full h-full object-cover" src={user.avatarUrl} />
                        ) : (
                          <div className="w-full h-full bg-wp-primary/20 flex items-center justify-center text-wp-primary font-bold text-xs">
                            {user.fullName[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-wp-on-surface">{user.fullName}</p>
                        <p className="text-[11px] text-wp-on-surface-variant/50">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-wp-on-surface-variant">{user.department || "N/A"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-wp-primary/10 text-wp-primary' : 'bg-wp-surface-container-highest text-wp-on-surface-variant'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-wp-error/10 text-wp-error border border-wp-error/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-wp-error"></span> {user.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to="/admin/users" className="p-2 text-wp-on-surface-variant/50 hover:text-wp-on-surface hover:bg-wp-surface-container-highest rounded-lg transition-all">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-wp-on-surface-variant">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Content Moderation & Training Paths ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Videos List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-wp-error">pending_actions</span>
            <h2 className="text-xl font-bold text-wp-on-surface">Content Moderation Queue</h2>
            <span className="ml-auto text-xs text-wp-on-surface-variant/40 font-bold">{metrics?.pendingApprovals || 0} PENDING</span>
          </div>

          <div className="space-y-3">
            {moderationQueue.map((video) => (
              <div key={video.id} className="glass-panel p-4 rounded-xl flex gap-4 hover:bg-wp-surface-bright transition-all cursor-pointer group">
                <div className="w-32 h-20 rounded-lg bg-wp-surface-lowest overflow-hidden shrink-0 relative">
                  {video.thumbnailUrl ? (
                    <img
                      alt="Video Thumbnail"
                      className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                      src={video.thumbnailUrl}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-wp-surface-container-highest">
                      <span className="material-symbols-outlined text-wp-outline text-3xl">movie</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-wp-on-surface/80 group-hover:text-wp-primary transition-colors">play_circle</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate text-wp-on-surface">{video.title}</h4>
                  <p className="text-xs text-wp-on-surface-variant/60">Uploaded by: {video.creator?.fullName || "Unknown"}</p>
                  <div className="flex gap-2 mt-3">
                    <Link to="/admin/moderation" className="text-[10px] font-black uppercase tracking-tighter bg-wp-surface-container-high text-wp-on-surface px-3 py-1 rounded border border-wp-outline-variant/30 hover:bg-wp-surface-container-highest transition-colors">Review</Link>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 rounded uppercase">{video.status}</span>
                  <span className="material-symbols-outlined text-wp-on-surface-variant/30">more_vert</span>
                </div>
              </div>
            ))}
            {moderationQueue.length === 0 && (
              <div className="glass-panel p-8 rounded-xl text-center">
                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">task_alt</span>
                <p className="text-wp-on-surface-variant">All caught up! No pending videos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Training Paths Tool */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-wp-primary">route</span>
            <h2 className="text-xl font-bold text-wp-on-surface">Training Paths</h2>
          </div>
          <div className="bg-wp-surface-container-low p-6 rounded-xl border border-wp-outline-variant/10 h-fit">
            <p className="text-sm font-semibold mb-4 text-wp-on-surface-variant">Quick Assign Path</p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-black text-wp-on-surface-variant/50 block mb-1">Select Video</label>
                <div className="w-full bg-wp-surface-lowest p-3 rounded-lg border border-wp-outline-variant/20 text-xs flex justify-between items-center cursor-pointer text-wp-on-surface hover:border-wp-primary/30 transition-colors">
                  <span>Security Protocol v4.2</span>
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-black text-wp-on-surface-variant/50 block mb-1">Department</label>
                <div className="w-full bg-wp-surface-lowest p-3 rounded-lg border border-wp-outline-variant/20 text-xs flex justify-between items-center cursor-pointer text-wp-on-surface hover:border-wp-primary/30 transition-colors">
                  <span>All IT Departments</span>
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </div>
              </div>
              <div className="pt-4">
                <label className="flex items-center gap-2 text-xs text-wp-on-surface-variant mb-4 cursor-pointer">
                  <input defaultChecked type="checkbox" className="rounded border-none bg-wp-surface-container-highest text-wp-primary focus:ring-0 focus:ring-offset-0" />
                  Mandatory for all new hires
                </label>
                <button className="w-full py-3 bg-wp-surface-container-highest text-wp-on-surface font-bold rounded-lg text-sm hover:bg-wp-surface-bright transition-all">
                  Assign Mandatory Path
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contextual FAB ── */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-wp-primary to-wp-primary-container rounded-full shadow-2xl flex items-center justify-center text-wp-on-primary hover:scale-110 active:scale-95 transition-all z-30 group">
        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">add</span>
      </button>
    </div>
  );
}
