import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Play, Award, Subtitles, Infinity, PlayCircle,
  FileText, BarChart2, CheckCircle2, Lock, ArrowLeft, Plus
} from 'lucide-react';
import { playlistApi } from '../api/playlistApi';
import SelectVideosModal from '../components/ui/SelectVideosModal';
import { useAuthStore } from '../store/useAuthStore';
import type { Playlist, Video } from '../types';

function formatDuration(seconds: number): string {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const fetchPlaylist = () => {
    if (id) {
      playlistApi.getPlaylistById(id)
        .then(setPlaylist)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchPlaylist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isOwner = !!(currentUser && playlist && playlist.userId === currentUser.id);

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-wp-on-surface-variant">Loading learning path details...</div>;
  }

  if (!playlist) {
    return <div className="p-10 text-center text-wp-on-surface-variant">Learning path not found.</div>;
  }

  // Videos derived from playlist items
  const videos: Video[] = (playlist.items || [])
    .sort((a, b) => a.order - b.order)
    .map((item) => item.video)
    .filter((v): v is Video => !!v);

  const totalDuration = videos.reduce((acc, v) => acc + (v.metadata?.duration ?? 0), 0);

  // Mock progress setup for UX showcasing
  // In a real app we derive this tracking from WatchHistory
  const completedCount = Math.min(1, videos.length); 
  const progress = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

  return (
    <div className="animate-slide-up -my-6 -mx-6 lg:-mx-8 lg:-mt-8">
      {/* ── Hero Section ── */}
      <section className="relative w-full h-[614px] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover opacity-40" 
            alt="cinematic workspace" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAumoYSG7B3chXRjR1Yuyue-oljobmVfqV6l4bWsT4gJqtXiWsd8cgJyiEaCeaaxqI3cqaeN9J0GdiL2VjTYJ8zIVxKp_u0j_2IoVaB1X3wzh_it8kQWQCNhwFNQzM7HbGO8c_Eccj6mkczJ4aIBFktOAnmRubEFx1noeid14PDUYdFOs_cl4Pp6GumUney4KuPUE6QeLpmuDNJNbHSxvEOZnL3-_e7HruYdGTHxqTQVs6P-ovZ59uPaNT07KIGq5gMD15h3amLrQXW"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wp-background via-wp-background/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-wp-background to-transparent"></div>
        </div>
        
        {/* Back button layer */}
        <div className="absolute top-8 left-8 lg:left-12 z-20">
             <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wp-surface-container/50 hover:bg-wp-surface-container backdrop-blur border border-wp-outline/10 text-sm font-medium text-wp-on-surface transition-colors"
                >
                <ArrowLeft size={16} /> Back
             </button>
        </div>

        <div className="relative z-10 px-8 lg:px-12 pb-16 w-full max-w-6xl">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="px-3 py-1 bg-wp-primary/10 border border-wp-primary/20 text-wp-primary font-bold uppercase tracking-widest rounded-full text-[10px]">
              {playlist.isPrivate ? 'PRIVATE PATH' : 'LEARNING PATH'}
            </span>
            <span className="text-wp-on-surface-variant/60 text-xs font-medium">
              • {videos.length} Lessons
            </span>
            <span className="text-wp-on-surface-variant/60 text-xs font-medium">
              • {formatDuration(totalDuration)} total
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter mb-8 leading-tight text-wp-on-surface">
            {playlist.name}
          </h1>

          <div className="flex flex-wrap items-center gap-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-2 border-wp-surface-bright p-0.5 shrink-0">
                <img 
                  className="w-full h-full object-cover rounded-full bg-wp-surface-container-high" 
                  alt={playlist.user?.fullName} 
                  src={playlist.user?.avatarUrl || `https://ui-avatars.com/api/?name=${playlist.user?.fullName}`}
                />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-xs text-wp-on-surface-variant/70 font-medium">Curator</p>
                <p className="text-lg font-bold text-wp-on-surface">{playlist.user?.fullName}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link 
                to={videos.length > 0 ? `/playlists/${playlist.id}/play?v=${videos[0].id}` : '#'}
                className="flex items-center justify-center bg-wp-gradient px-10 py-4 rounded-xl font-bold text-wp-on-primary shadow-[0_10px_40px_-10px_rgba(0,82,255,0.4)] hover:scale-105 transition-transform"
              >
                {progress > 0 ? 'Continue Learning' : 'Start Path'}
              </Link>
              <button className="bg-wp-surface-container-high border border-wp-outline-variant/10 px-8 py-4 rounded-xl font-bold text-wp-on-surface hover:bg-wp-surface-bright transition-colors">
                View Resources
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content Grid ── */}
      <section className="px-8 lg:px-12 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto pb-24">
        {/* Syllabus List (Main Column) */}
        <div className="lg:col-span-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <h2 className="text-3xl font-bold tracking-tight text-wp-on-surface">Syllabus</h2>
            <div className="flex items-center gap-3 text-xs font-semibold text-wp-on-surface-variant/50">
              <span className="flex items-center gap-1">
                <PlayCircle size={14} className="text-wp-on-surface-variant/70" /> 
                {videos.length} Videos
              </span>
              <span className="flex items-center gap-1">
                <FileText size={14} className="text-wp-on-surface-variant/70" /> 
                4 Assets
              </span>
              {isOwner && (
                <button
                  onClick={() => setIsManageOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-wp-primary/10 hover:bg-wp-primary/20 border border-wp-primary/30 text-wp-primary rounded-lg transition-colors text-xs font-bold"
                >
                  <Plus size={13} /> Manage Videos
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {videos.length === 0 ? (
               <div className="p-12 flex flex-col items-center justify-center text-center bg-wp-surface-container-low rounded-2xl border border-dashed border-wp-outline/20">
                 <PlayCircle size={40} className="text-wp-on-surface-variant/20 mb-3" />
                 <p className="font-bold text-wp-on-surface mb-1">This playlist is empty</p>
                 <p className="text-sm text-wp-on-surface-variant mb-5">Start building your learning path by adding videos.</p>
                 {isOwner && (
                   <button
                     onClick={() => setIsManageOpen(true)}
                     className="flex items-center gap-2 px-5 py-2.5 bg-wp-gradient text-wp-on-primary font-bold rounded-xl shadow-lg shadow-wp-primary/20 hover:scale-105 transition-transform text-sm"
                   >
                     <Plus size={16} /> Add your first video
                   </button>
                 )}
               </div>
            ) : videos.map((video, idx) => {
              const isCompleted = idx < completedCount;
              const isActive = idx === completedCount;
              const isLocked = idx > completedCount;
              
              const num = String(idx + 1).padStart(2, '0');
              const dur = video.metadata?.duration ?? 0;

              return (
                <Link
                  key={video.id + idx}
                  to={`/playlists/${playlist.id}/play?v=${video.id}`}
                  className={`group flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl transition-all relative overflow-hidden ${
                    isActive 
                      ? 'bg-wp-surface-bright border border-wp-primary/30 shadow-xl shadow-wp-primary/5 cursor-pointer' 
                      : isCompleted
                        ? 'bg-wp-surface-container-low hover:bg-wp-surface-container cursor-pointer'
                        : 'bg-wp-surface-container-low/50 opacity-60 hover:opacity-100 cursor-pointer grayscale hover:grayscale-0'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-wp-primary"></div>}
                  
                  {/* Status Icon */}
                  <div className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-xl border ${
                    isActive
                      ? 'bg-wp-primary text-wp-on-primary border-transparent'
                      : isCompleted
                        ? 'bg-wp-primary/20 text-wp-primary border-wp-primary/20'
                        : 'bg-wp-surface-variant text-wp-on-surface-variant/40 border-transparent'
                  }`}>
                    {isActive ? <Play className="fill-current" size={20} /> : isCompleted ? <CheckCircle2 size={24} /> : <Lock size={20} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-bold tracking-widest uppercase mb-1 block truncate ${
                      isLocked ? 'text-wp-on-surface-variant/40' : 'text-wp-primary'
                    }`}>
                      Lesson {num}
                    </span>
                    <h3 className="text-lg font-bold text-wp-on-surface truncate">{video.title}</h3>
                  </div>

                  {/* Right Status */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-wp-on-surface-variant">{formatDuration(dur)}</p>
                    {isCompleted && <p className="text-[10px] text-wp-primary font-bold mt-1 uppercase">COMPLETED</p>}
                    {isActive && <p className="text-[10px] text-wp-on-surface-variant font-bold opacity-40 mt-1 uppercase">IN PROGRESS</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Info (Secondary Column) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Progress Glass Card */}
          <div className="bg-wp-surface-container-low/40 backdrop-blur-xl border border-wp-outline/10 p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <BarChart2 size={120} strokeWidth={1} />
            </div>
            <h4 className="text-sm font-bold text-wp-on-surface-variant/60 uppercase tracking-widest mb-4">Your Progress</h4>
            <div className="text-4xl font-black mb-2 text-wp-on-surface">{progress}%</div>
            
            <div className="w-full bg-wp-surface-container h-1.5 rounded-full mb-6">
              <div className="bg-wp-primary h-full rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            
            <p className="text-sm text-wp-on-surface-variant leading-relaxed">
              You've completed {completedCount} of {videos.length} lessons. Keep going to earn your <span className="text-wp-primary font-bold">Professional Certification</span>.
            </p>
          </div>

          {/* Instructor Sub-Card */}
          <div className="bg-wp-surface-container-low p-6 rounded-3xl border border-wp-outline/5">
            <h4 className="text-xs font-bold text-wp-on-surface-variant/60 uppercase tracking-widest mb-6">About the Curator</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <img 
                   className="w-12 h-12 rounded-full object-cover shrink-0 bg-wp-surface-container-high" 
                   alt={playlist.user?.fullName} 
                   src={playlist.user?.avatarUrl || `https://ui-avatars.com/api/?name=${playlist.user?.fullName}`}
                />
                <div className="min-w-0">
                  <p className="font-bold text-wp-on-surface truncate">{playlist.user?.fullName}</p>
                  <p className="text-xs text-wp-primary truncate">{playlist.user?.title || 'Creator @ WayPoint'}</p>
                </div>
              </div>
              <p className="text-sm text-wp-on-surface-variant/80 italic leading-snug">
                "Architecture is not about making systems complex, but finding the simplest way to manage complexity."
              </p>
            </div>
          </div>

          {/* Feature List */}
          <div className="px-2 space-y-4">
            <div className="flex items-center gap-4">
              <Award size={20} className="text-wp-primary shrink-0" />
              <span className="text-sm font-medium text-wp-on-surface">Official Certificate of Completion</span>
            </div>
            <div className="flex items-center gap-4">
              <Subtitles size={20} className="text-wp-primary shrink-0" />
              <span className="text-sm font-medium text-wp-on-surface">Subtitles in 12 languages</span>
            </div>
            <div className="flex items-center gap-4">
              <Infinity size={20} className="text-wp-primary shrink-0" />
              <span className="text-sm font-medium text-wp-on-surface">Lifetime access to all updates</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── Manage Videos Modal ── */}
      {isManageOpen && playlist && (
        <SelectVideosModal
          playlist={playlist}
          onClose={() => setIsManageOpen(false)}
          onUpdated={() => fetchPlaylist()}
        />
      )}
    </div>
  );
}
