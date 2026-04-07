import { useParams, Link } from 'react-router-dom';
import {
  Play, Check, Lock, Award, Subtitles, Infinity,
} from 'lucide-react';
import { courses } from '../data/mockData';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTotal(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const course = courses.find((c) => c.id === id) || courses[0];

  const completedLessons = course.lessons.filter((l) => l.status === 'completed').length;
  const progress = course.progress || 0;

  return (
    <div className="animate-slide-up -mx-6 lg:-mx-8 -mt-6 lg:-mt-8">
      {/* ── Hero Section ── */}
      <section className="relative w-full h-[520px] lg:h-[580px] flex items-end overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wp-surface via-wp-surface/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-wp-surface to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-8 lg:px-12 pb-14 w-full max-w-5xl">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 bg-wp-primary/10 border border-wp-primary/20 text-wp-primary
              text-[10px] font-bold uppercase tracking-[0.15em] rounded-full">
              {course.category}
            </span>
            <span className="text-wp-on-surface-variant/60 text-xs">
              • {course.lessons.length} Lessons
            </span>
            <span className="text-wp-on-surface-variant/60 text-xs">
              • {formatTotal(course.totalDuration)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-8 leading-[0.95]">
            {course.title.split(' ').slice(0, -2).join(' ')}{' '}
            <br />
            <span className="text-wp-primary">
              {course.title.split(' ').slice(-2).join(' ')}
            </span>
          </h1>

          {/* Instructor + CTA */}
          <div className="flex flex-wrap items-center gap-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-2 border-wp-surface-bright p-0.5">
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <p className="text-xs text-wp-on-surface-variant/70 font-medium">Lead Instructor</p>
                <p className="text-lg font-bold text-wp-on-surface">{course.instructor.name}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                to={`/courses/${course.id}/play`}
                className="bg-wp-gradient px-10 py-4 rounded-xl font-bold text-wp-on-primary
                  shadow-2xl hover:scale-105 transition-transform inline-flex items-center gap-2"
              >
                <Play size={18} className="fill-current" />
                {course.status === 'in_progress' ? 'Continue Learning' : 'Start Course'}
              </Link>
              <button className="bg-wp-surface-container-high px-8 py-4 rounded-xl font-bold text-wp-on-surface
                hover:bg-wp-surface-bright transition-colors ghost-border">
                View Resources
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content Grid ── */}
      <section className="px-8 lg:px-12 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl">
        {/* Syllabus List (Main Column) */}
        <div className="lg:col-span-8">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-wp-on-surface">Course Syllabus</h2>
            <div className="flex items-center gap-4 text-xs font-semibold text-wp-on-surface-variant/50">
              <span>{course.lessons.length} lessons</span>
              <span>•</span>
              <span>{formatTotal(course.totalDuration)} total</span>
            </div>
          </div>

          <div className="space-y-4">
            {course.lessons.map((lesson, idx) => {
              const isCompleted = lesson.status === 'completed';
              const isActive = lesson.status === 'in_progress';
              const isLocked = lesson.status === 'locked';
              const lessonNum = String(idx + 1).padStart(2, '0');

              return (
                <Link
                  key={lesson.id}
                  to={!isLocked ? `/courses/${course.id}/play` : '#'}
                  className={`group flex items-center gap-6 p-5 rounded-2xl transition-all cursor-pointer relative overflow-hidden
                    ${isActive
                      ? 'bg-wp-surface-bright border border-wp-primary/30 shadow-xl shadow-wp-primary/5'
                      : isLocked
                        ? 'bg-wp-surface-container-low/50 opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                        : 'bg-wp-surface-container-low hover:bg-wp-surface-container'
                    }`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-wp-primary" />
                  )}

                  {/* Status icon */}
                  <div className={`w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0
                    ${isCompleted
                      ? 'bg-wp-primary/20 text-wp-primary border border-wp-primary/20'
                      : isActive
                        ? 'bg-wp-primary text-wp-on-primary'
                        : 'bg-wp-surface-variant text-wp-on-surface-variant/40'
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={20} />
                    ) : isActive ? (
                      <Play size={18} className="fill-current" />
                    ) : (
                      <Lock size={18} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-bold tracking-[0.15em] uppercase mb-1 block
                      ${isActive || isCompleted ? 'text-wp-primary' : 'text-wp-on-surface-variant/40'}`}>
                      Lesson {lessonNum}
                    </span>
                    <h3 className="text-lg font-bold text-wp-on-surface line-clamp-1">
                      {lesson.title}
                    </h3>
                  </div>

                  {/* Duration + status */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-wp-on-surface-variant">
                      {formatTime(lesson.duration)}
                    </p>
                    {isCompleted && (
                      <p className="text-[10px] text-wp-primary font-bold mt-0.5">COMPLETED</p>
                    )}
                    {isActive && (
                      <p className="text-[10px] text-wp-on-surface-variant/40 font-bold uppercase mt-0.5">
                        In Progress
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Info (Secondary Column) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Glass Card: Progress */}
          <div className="glass ghost-border p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-wp-on-surface opacity-[0.04]">
              <Award size={80} />
            </div>
            <h4 className="text-xs font-bold text-wp-on-surface-variant/60 uppercase tracking-[0.15em] mb-4">
              Your Progress
            </h4>
            <div className="text-4xl font-black text-wp-on-surface mb-2">{progress}%</div>
            <div className="w-full bg-wp-surface-container h-1.5 rounded-full mb-6">
              <div
                className="bg-wp-primary h-full rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-wp-on-surface-variant leading-relaxed">
              You've completed {completedLessons} of {course.lessons.length} lessons.
              Keep going to earn your{' '}
              <span className="text-wp-primary font-bold">Professional Certification</span>.
            </p>
          </div>

          {/* Instructor Card */}
          <div className="bg-wp-surface-container-low p-6 rounded-3xl space-y-4">
            <h4 className="text-xs font-bold text-wp-on-surface-variant/60 uppercase tracking-[0.15em] mb-6">
              About the instructor
            </h4>
            <div className="flex items-center gap-4">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-wp-on-surface">{course.instructor.name}</p>
                <p className="text-xs text-wp-primary">{course.instructor.title}</p>
              </div>
            </div>
            {course.instructor.bio && (
              <p className="text-sm text-wp-on-surface-variant/80 italic leading-snug">
                "{course.instructor.bio}"
              </p>
            )}
          </div>

          {/* Feature List */}
          <div className="px-2 space-y-4">
            <div className="flex items-center gap-4">
              <Award size={20} className="text-wp-primary flex-shrink-0" />
              <span className="text-sm font-medium text-wp-on-surface">Official Certificate of Completion</span>
            </div>
            <div className="flex items-center gap-4">
              <Subtitles size={20} className="text-wp-primary flex-shrink-0" />
              <span className="text-sm font-medium text-wp-on-surface">Subtitles in 12 languages</span>
            </div>
            <div className="flex items-center gap-4">
              <Infinity size={20} className="text-wp-primary flex-shrink-0" />
              <span className="text-sm font-medium text-wp-on-surface">Lifetime access to all updates</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
