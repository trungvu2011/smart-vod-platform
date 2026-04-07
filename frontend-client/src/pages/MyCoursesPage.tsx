import { Link } from 'react-router-dom';
import { Play, ChevronRight } from 'lucide-react';
import CourseCard from '../components/ui/CourseCard';
import { courses, continueLearningCourses } from '../data/mockData';

export default function MyCoursesPage() {
  const enrolledCourses = courses.filter(
    (c) => c.status === 'in_progress' || c.status === 'completed'
  );
  const heroCard = continueLearningCourses[0];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Hero — Continue Learning */}
      {heroCard && (
        <section className="relative rounded-wp-xl overflow-hidden h-[260px] group">
          <img
            src={heroCard.thumbnailUrl}
            alt={heroCard.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-wp-surface via-wp-surface/80 to-transparent" />
          <div className="absolute inset-0 flex items-center p-8">
            <div className="max-w-md space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-wp-tertiary">
                Continue Learning
              </span>
              <h2 className="text-2xl font-bold text-wp-on-surface">{heroCard.title}</h2>
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 bg-wp-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-wp-primary-container rounded-full"
                    style={{ width: `${heroCard.progress || 0}%` }}
                  />
                </div>
                <span className="text-xs text-wp-on-surface-variant">{heroCard.progress}%</span>
              </div>
              <Link
                to={`/courses/${heroCard.id}/play`}
                className="btn-primary inline-flex items-center gap-2 text-sm"
              >
                <Play size={14} className="fill-current" /> Resume
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Enrolled courses */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-wp-on-surface">Active Enrollments</h2>
          <Link to="/courses" className="text-sm text-wp-primary hover:text-wp-primary-fixed 
            flex items-center gap-1 transition-colors">
            Browse All <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {enrolledCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}
