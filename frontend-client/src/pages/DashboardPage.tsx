import { Link } from 'react-router-dom';
import { Play, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import VideoCard from '../components/ui/VideoCard';
import CourseCard from '../components/ui/CourseCard';
import {
  featuredVideo, discoveryVideos, recentUploads, continueLearningCourses
} from '../data/mockData';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export default function DashboardPage() {
  return (
    <div className="space-y-10 animate-slide-up">
      {/* Hero Banner — Featured Video */}
      <section className="relative rounded-wp-xl overflow-hidden h-[380px] group">
        <img
          src={featuredVideo.thumbnailUrl}
          alt={featuredVideo.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wp-surface via-wp-surface/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
          <span className="inline-block px-3 py-1 text-[11px] font-semibold uppercase tracking-wide
            bg-wp-primary-container/20 text-wp-primary-fixed rounded-md backdrop-blur-sm">
            Featured
          </span>
          <h1 className="text-3xl font-bold text-wp-on-surface leading-tight max-w-2xl
            tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            {featuredVideo.title}
          </h1>
          <p className="text-sm text-wp-on-surface-variant max-w-xl leading-relaxed">
            {featuredVideo.description}
          </p>
          <div className="flex items-center gap-3">
            <Link
              to={`/watch/${featuredVideo.id}`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Play size={16} className="fill-current" />
              Watch Now
            </Link>
            <span className="text-xs text-wp-outline flex items-center gap-1">
              <Clock size={14} />
              {formatDuration(featuredVideo.duration)}
            </span>
          </div>
        </div>
      </section>

      {/* Discovery Cluster */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-semibold text-wp-on-surface">Discovery Cluster</h2>
            <p className="text-sm text-wp-on-surface-variant mt-0.5">
              Curated picks for your professional growth
            </p>
          </div>
          <Link to="/trending" className="text-sm text-wp-primary hover:text-wp-primary-fixed 
            flex items-center gap-1 transition-colors">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {discoveryVideos.map((video) => (
            <VideoCard key={video.id} video={video} size="lg" />
          ))}
        </div>
      </section>

      {/* Continue Learning */}
      {continueLearningCourses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-wp-on-surface">Continue Learning</h2>
              <p className="text-sm text-wp-on-surface-variant mt-0.5">
                Pick up where you left off
              </p>
            </div>
            <Link to="/my-courses" className="text-sm text-wp-primary hover:text-wp-primary-fixed 
              flex items-center gap-1 transition-colors">
              My Courses <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {continueLearningCourses.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Uploads */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-wp-on-surface">Recent Uploads</h2>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full border border-wp-outline-variant/20 flex items-center justify-center text-wp-on-surface-variant hover:bg-wp-surface-container-high transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button className="w-10 h-10 rounded-full border border-wp-outline-variant/20 flex items-center justify-center text-wp-on-surface-variant hover:bg-wp-surface-container-high transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentUploads.map((video, idx) => (
            <Link
              key={video.id}
              to={`/watch/${video.id}`}
              className="group cursor-pointer block"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] text-white font-medium">
                  {formatDuration(video.duration)}
                </div>
              </div>
              <h4 className="font-bold text-sm text-wp-on-surface leading-snug group-hover:text-wp-primary transition-colors">
                {video.title}
              </h4>
              <p className="text-xs text-wp-on-surface-variant mt-1">
                {video.channel.name} • {Math.max(1, idx * 2 + 1)} days ago
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
