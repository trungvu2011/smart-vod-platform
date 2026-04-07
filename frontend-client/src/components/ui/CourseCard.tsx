import { Link } from 'react-router-dom';
import { Clock, Signal } from 'lucide-react';
import type { Course } from '../../types';

interface CourseCardProps {
  course: Course;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getLessonProgress(course: Course): string | null {
  if (!course.lessons || course.lessons.length === 0) return null;
  const completed = Math.round((course.progress || 0) * course.lessons.length / 100);
  return `${completed}/${course.lessons.length} Lessons`;
}

export default function CourseCard({ course }: CourseCardProps) {
  const hasProgress = course.status && course.status !== 'not_started' && (course.progress || 0) > 0;
  const isCompleted = course.status === 'completed' || (course.progress || 0) >= 100;

  const levelLabel = (() => {
    const d = course.totalDuration;
    if (d > 36000) return 'Advanced';
    if (d > 18000) return 'Intermediate';
    return 'Beginner';
  })();

  const lessonProgress = getLessonProgress(course);

  const ctaLabel = isCompleted
    ? 'Review Course'
    : hasProgress
      ? (course.progress || 0) >= 80 ? 'Almost Finished' : 'Continue Learning'
      : 'Enroll Now';

  return (
    <Link
      to={`/courses/${course.id}`}
      className="group bg-wp-surface-container-low rounded-xl overflow-hidden
        hover:scale-[1.02] transition-all duration-300 flex flex-col h-full shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-wp-surface-container-low via-transparent to-transparent opacity-60" />
        {/* Category badge */}
        <div className="absolute top-4 left-4 glass ghost-border px-3 py-1 rounded-full
          text-[10px] font-bold uppercase tracking-[0.12em] text-wp-primary">
          {course.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold leading-tight text-wp-on-surface mb-3
          group-hover:text-wp-primary transition-colors line-clamp-2">
          {course.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-wp-on-surface-variant mb-6">
          <span className="flex items-center gap-1.5">
            <Signal size={13} /> {levelLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} /> {formatDuration(course.totalDuration)}
          </span>
        </div>

        {/* Progress + CTA area */}
        <div className="mt-auto space-y-4">
          {hasProgress && (
            <div>
              <div className="flex justify-between text-[11px] font-bold text-wp-on-surface-variant uppercase tracking-wider mb-2">
                <span>Progress</span>
                {lessonProgress && <span>{lessonProgress}</span>}
              </div>
              <div className="h-1.5 w-full bg-wp-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-wp-primary-container rounded-full"
                  style={{
                    width: `${course.progress}%`,
                    boxShadow: '0 0 8px rgba(0,82,255,0.4)',
                  }}
                />
              </div>
            </div>
          )}

          <button
            className={`w-full py-3 rounded-lg font-bold text-sm tracking-wide
              active:scale-95 transition-all ${
                hasProgress
                  ? 'bg-wp-gradient text-wp-on-primary'
                  : 'bg-wp-surface-container-high text-wp-on-surface hover:bg-wp-surface-bright'
              }`}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </Link>
  );
}
