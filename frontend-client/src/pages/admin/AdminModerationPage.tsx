import { useState, useEffect } from "react";
import { adminApi } from "../../api/adminApi";
import type { Video } from "../../types";

export default function AdminModerationPage() {
  const [pendingVideos, setPendingVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getModerationQueue();
      setPendingVideos(data);
    } catch (error) {
      console.error("Failed to fetch moderation queue:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (videoId: string) => {
    try {
      await adminApi.approveVideo(videoId);
      await fetchQueue();
    } catch (error) {
      console.error("Failed to approve video:", error);
    }
  };

  const handleReject = async (videoId: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (reason === null) return; // User cancelled
    try {
      await adminApi.rejectVideo(videoId, reason);
      await fetchQueue();
    } catch (error) {
      console.error("Failed to reject video:", error);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* Moderation Queue */}
      <section className="flex-1 p-8 overflow-y-auto w-full xl:min-w-[800px]">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-wp-on-surface mb-2">Content Moderation</h1>
            <p className="text-wp-on-surface-variant max-w-md">Review pending video submissions and ensure compliance with community guidelines.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-wp-surface-container-high px-4 py-2 rounded-xl flex items-center gap-3 border border-wp-outline-variant/10 shadow-sm">
              <span className="text-wp-primary font-bold">{pendingVideos.length}</span>
              <span className="text-xs uppercase tracking-widest text-wp-outline font-semibold">Pending</span>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {loading ? (
             <div className="col-span-2 text-center text-wp-on-surface-variant py-8">Loading queue...</div>
          ) : pendingVideos.length === 0 ? (
             <div className="col-span-2 bg-wp-surface-container-low p-12 rounded-2xl text-center border border-wp-outline-variant/10">
               <span className="material-symbols-outlined text-5xl text-emerald-500 mb-4">verified</span>
               <h3 className="text-xl font-bold text-wp-on-surface mb-2">Queue is empty</h3>
               <p className="text-wp-on-surface-variant">All videos have been reviewed and moderated.</p>
             </div>
          ) : pendingVideos.map((video) => (
            <div key={video.id} className="group bg-wp-surface-container-low rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 shadow-wp-card border border-wp-outline-variant/10 flex flex-col">
              <div className="relative aspect-video overflow-hidden">
                {video.thumbnailUrl ? (
                   <img 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full bg-wp-surface-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-wp-outline">movie</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-wp-surface-container-low via-wp-surface-container-low/20 to-transparent opacity-80" />
                
                <div className="absolute top-4 left-4 bg-wp-error-container/80 backdrop-blur-md text-wp-on-error-container px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm">
                  {video.status}
                </div>
                
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <span className="bg-wp-surface-container-high/80 backdrop-blur-md px-2 py-1 rounded text-[10px] text-wp-on-surface font-medium border border-wp-outline-variant/20 shadow-sm">
                    {/* Placeholder for duration if we had it on the top video level instead of metadata */}
                    00:00
                  </span>
                  <span className="bg-wp-surface-container-high/80 backdrop-blur-md px-2 py-1 rounded text-[10px] text-wp-on-surface font-medium border border-wp-outline-variant/20 shadow-sm">
                    {video.visibility}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-wp-on-surface leading-tight mb-1">{video.title}</h3>
                      <div className="flex items-center gap-2">
                         {video.creator?.avatarUrl ? (
                            <img 
                              src={video.creator.avatarUrl} 
                              alt="creator"
                              className="w-5 h-5 rounded-full object-cover border border-wp-outline-variant/20" 
                            />
                         ) : (
                           <div className="w-5 h-5 rounded-full bg-wp-primary flex items-center justify-center text-[8px] font-bold text-white">
                             {video.creator?.fullName?.[0] || 'U'}
                           </div>
                         )}
                        <span className="text-xs text-wp-on-surface-variant font-medium">
                          {video.creator?.fullName || "Unknown"} • {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Flags (Mock values since no DB column yet) */}
                  <div className="mb-6">
                    <p className="text-[10px] uppercase tracking-widest text-wp-outline font-bold mb-2">AI Sensitivity Flags</p>
                    <div className="flex flex-wrap gap-2">
                       <span className="px-2 py-1 rounded text-[10px] font-bold border bg-wp-surface-container-highest text-wp-secondary border-wp-outline-variant/10">
                          Clear Audio
                       </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button onClick={() => handleApprove(video.id)} className="bg-wp-gradient text-wp-on-primary-fixed hover:text-wp-on-primary font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-wp-primary/20">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Approve
                  </button>
                  <button onClick={() => handleReject(video.id)} className="bg-wp-surface-container-high text-wp-on-surface font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-wp-surface-bright active:scale-95 transition-all border border-wp-outline-variant/10">
                    <span className="material-symbols-outlined text-lg">cancel</span>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Training Path Assignment Sidebar */}
      <aside className="w-full xl:w-80 bg-wp-surface-container-low border-l border-t xl:border-t-0 border-wp-outline-variant/10 p-6 flex flex-col shrink-0 flex-none xl:h-[calc(100vh-64px)] overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-wp-on-surface">Path Assignment</h2>
          <p className="text-xs text-wp-on-surface-variant mt-1">Force-assign approved content to departmental training paths.</p>
        </div>
        
        <div className="flex-1 space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-wp-outline font-bold block mb-3">Target Departments</label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-wp-surface-container rounded-xl hover:bg-wp-surface-container-high cursor-pointer transition-all border border-transparent hover:border-wp-primary/20">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-wp-primary">groups</span>
                  <span className="text-sm font-medium">Human Resources</span>
                </div>
                <input type="checkbox" className="rounded border-wp-outline-variant bg-wp-surface-lowest text-wp-primary focus:ring-wp-primary/20 w-4 h-4 cursor-pointer" />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-wp-surface-container rounded-xl hover:bg-wp-surface-container-high cursor-pointer transition-all border border-wp-primary/20 bg-wp-surface-container-high ring-1 ring-wp-primary/10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-wp-secondary">terminal</span>
                  <span className="text-sm font-medium">Engineering</span>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-wp-outline-variant bg-wp-surface-lowest text-wp-primary focus:ring-wp-primary/20 w-4 h-4 cursor-pointer" />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-wp-surface-container rounded-xl hover:bg-wp-surface-container-high cursor-pointer transition-all border border-transparent hover:border-wp-primary/20">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-wp-tertiary">campaign</span>
                  <span className="text-sm font-medium">Marketing</span>
                </div>
                <input type="checkbox" className="rounded border-wp-outline-variant bg-wp-surface-lowest text-wp-primary focus:ring-wp-primary/20 w-4 h-4 cursor-pointer" />
              </label>
              
              <label className="flex items-center justify-between p-3 bg-wp-surface-container rounded-xl hover:bg-wp-surface-container-high cursor-pointer transition-all border border-transparent hover:border-wp-primary/20">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-wp-on-surface-variant">shield</span>
                  <span className="text-sm font-medium">Security</span>
                </div>
                <input type="checkbox" className="rounded border-wp-outline-variant bg-wp-surface-lowest text-wp-primary focus:ring-wp-primary/20 w-4 h-4 cursor-pointer" />
              </label>
            </div>
          </div>
          
          <div>
            <label className="text-[10px] uppercase tracking-widest text-wp-outline font-bold block mb-3">Priority Level</label>
            <div className="grid grid-cols-3 gap-2">
              <button className="py-2 text-[10px] font-bold border border-wp-outline-variant/30 rounded-lg text-wp-on-surface-variant hover:bg-wp-surface-container-high transition-all">LOW</button>
              <button className="py-2 text-[10px] font-bold bg-wp-primary/20 text-wp-primary border border-wp-primary/30 rounded-lg shadow-inner">NORMAL</button>
              <button className="py-2 text-[10px] font-bold border border-wp-outline-variant/30 rounded-lg text-wp-on-surface-variant hover:bg-wp-surface-container-high transition-all">URGENT</button>
            </div>
          </div>
          
          <div className="bg-wp-surface-container-high/50 p-4 rounded-xl border border-wp-outline-variant/10 shadow-inner">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-wp-tertiary-fixed text-lg mt-0.5">info</span>
              <p className="text-[11px] leading-relaxed text-wp-on-surface-variant">Selected paths will receive an automatic notification upon video approval. Videos will appear in their 'Required Learning' tab immediately.</p>
            </div>
          </div>
        </div>
        
        <div className="pt-6 mt-6 border-t border-wp-outline-variant/10">
          <button className="w-full bg-wp-surface-container-highest text-wp-on-surface font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-wp-surface-bright active:scale-95 transition-all border border-wp-outline-variant/20 shadow-wp-card">
            <span className="material-symbols-outlined text-lg">auto_awesome</span>
            Apply Auto-Assignment
          </button>
        </div>
      </aside>
    </div>
  );
}
