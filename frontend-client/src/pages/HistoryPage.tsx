import { Link } from 'react-router-dom';
import { SlidersHorizontal, Trash2, MoreVertical } from 'lucide-react';
import { watchHistory } from '../data/mockData';
import type { HistoryItem } from '../types';

// Extend mock data with categories for richer display
interface HistoryCard extends HistoryItem {
  category: string;
  timeLabel: string;
}

const enrichedHistory: HistoryCard[] = watchHistory.map((item, i) => {
  const categories = ['STRATEGY', 'IT & SECURITY', 'HR', 'ANALYTICS', 'ENGINEERING', 'OPERATIONS'];
  const diff = Date.now() - new Date(item.watchedAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  let timeLabel: string;
  if (hours < 24) timeLabel = `${hours} hours ago`;
  else if (hours < 48) {
    const d = new Date(item.watchedAt);
    timeLabel = `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  } else {
    const d = new Date(item.watchedAt);
    timeLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return { ...item, category: categories[i % categories.length], timeLabel };
});

// Group by period
function groupHistory(items: HistoryCard[]) {
  const now = Date.now();
  const today: HistoryCard[] = [];
  const yesterday: HistoryCard[] = [];
  const lastWeek: HistoryCard[] = [];
  const older: HistoryCard[] = [];

  for (const item of items) {
    const diff = now - new Date(item.watchedAt).getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) today.push(item);
    else if (hours < 48) yesterday.push(item);
    else if (hours < 168) lastWeek.push(item);
    else older.push(item);
  }

  const groups: { label: string; items: HistoryCard[]; highlight: boolean }[] = [];
  if (today.length) groups.push({ label: 'Today', items: today, highlight: true });
  if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday, highlight: false });
  if (lastWeek.length) groups.push({ label: 'Last Week', items: lastWeek, highlight: false });
  if (older.length) groups.push({ label: 'Earlier', items: older, highlight: false });

  return groups;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function HistoryPage() {
  const groups = groupHistory(enrichedHistory);

  return (
    <div className="space-y-12 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-wp-on-surface">
            Watch History
          </h1>
          <p className="text-wp-on-surface-variant text-lg">
            Continue where you left off in your professional journey.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-wp-surface-container-high text-wp-on-surface px-6 py-2.5 rounded-lg
            flex items-center gap-2 hover:bg-wp-surface-bright transition-all text-sm font-medium">
            <SlidersHorizontal size={14} />
            Filter
          </button>
          <button className="bg-wp-surface-container-high text-wp-on-surface px-6 py-2.5 rounded-lg
            flex items-center gap-2 hover:bg-wp-surface-bright transition-all text-sm font-medium">
            <Trash2 size={14} />
            Clear History
          </button>
        </div>
      </div>

      {/* Grouped sections */}
      {groups.map((group) => (
        <section key={group.label} className="space-y-8">
          {/* Section divider */}
          <div className="flex items-center gap-4">
            <h2 className={`text-sm font-bold uppercase tracking-[0.15em] flex-shrink-0 ${
              group.highlight ? 'text-wp-primary-fixed' : 'text-wp-on-surface-variant/60'
            }`}>
              {group.label}
            </h2>
            <div className="h-px flex-1 bg-wp-outline-variant/10" />
          </div>

          {/* Video cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {group.items.map((item) => (
              <Link
                key={item.id}
                to={`/watch/${item.video.id}`}
                className="group cursor-pointer block"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-wp-surface-lowest mb-4
                  transition-transform duration-300 group-hover:scale-[1.02]">
                  <img
                    src={item.video.thumbnailUrl}
                    alt={item.video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-wp-surface-container-highest">
                    <div
                      className="h-full bg-wp-primary"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  {/* Status badge */}
                  <div className="absolute top-3 right-3 glass px-2 py-1 rounded ghost-border
                    text-[10px] font-bold text-white uppercase tracking-wider">
                    {item.progress >= 100 ? 'Completed' : `${item.progress}% Watched`}
                  </div>

                  {/* Duration */}
                  <div className="absolute bottom-3 left-3 glass px-1.5 py-0.5 rounded
                    text-[10px] font-medium text-white">
                    {formatDuration(item.video.duration)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-wp-on-surface font-semibold text-sm line-clamp-1
                      group-hover:text-wp-primary transition-colors">
                      {item.video.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black bg-wp-primary-container/20 text-wp-primary-fixed
                        px-1.5 py-0.5 rounded uppercase tracking-wide">
                        {item.category}
                      </span>
                      <span className="text-xs text-wp-on-surface-variant/60">
                        {item.timeLabel}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="text-wp-on-surface-variant hover:text-wp-on-surface p-1 flex-shrink-0
                      opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {watchHistory.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <p className="text-wp-on-surface-variant text-lg">No watch history yet</p>
          <p className="text-sm text-wp-outline">Videos you watch will appear here</p>
        </div>
      )}
    </div>
  );
}
