import { useState } from 'react';
import {
  ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, ChevronUp,
  MoreVertical, Send, SmilePlus
} from 'lucide-react';

interface Comment {
  id: string;
  user: { name: string; avatar: string; role?: string };
  text: string;
  timeAgo: string;
  likes: number;
  liked: boolean;
  replies: Comment[];
}

const mockComments: Comment[] = [
  {
    id: 'c1',
    user: {
      name: 'Sarah Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      role: 'Engineering Lead',
    },
    text: 'The section on distributed consensus was incredibly well explained. I finally understand how Raft differs from Paxos in a practical production context. Would love to see a follow-up on CRDTs!',
    timeAgo: '2 hours ago',
    likes: 24,
    liked: false,
    replies: [
      {
        id: 'c1r1',
        user: {
          name: 'Marcus Thorne',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
          role: 'Instructor',
        },
        text: 'Thanks Sarah! CRDTs are definitely on the roadmap for the next series. Stay tuned 🎯',
        timeAgo: '1 hour ago',
        likes: 18,
        liked: false,
        replies: [],
      },
    ],
  },
  {
    id: 'c2',
    user: {
      name: 'David Park',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      role: 'Senior Developer',
    },
    text: 'Just applied the microservices decomposition pattern from lesson 4 at work. Reduced our deployment pipeline from 45 min to 8 min. This course pays for itself!',
    timeAgo: '5 hours ago',
    likes: 42,
    liked: true,
    replies: [],
  },
  {
    id: 'c3',
    user: {
      name: 'Nina Rodriguez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nina',
    },
    text: 'The comparison chart at 14:32 was super helpful. Can we get that as a downloadable PDF?',
    timeAgo: '1 day ago',
    likes: 9,
    liked: false,
    replies: [],
  },
  {
    id: 'c4',
    user: {
      name: 'Alex Kim',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      role: 'DevOps Engineer',
    },
    text: 'Bookmarking this for our next architecture review. Great stuff as always.',
    timeAgo: '2 days ago',
    likes: 7,
    liked: false,
    replies: [],
  },
];

type SortOption = 'top' | 'newest';

export default function CommentSection() {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('top');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set(['c1']));

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  const toggleReplies = (id: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleLike = (commentId: string, parentId?: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (parentId && c.id === parentId) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 }
                : r
            ),
          };
        }
        if (c.id === commentId) {
          return { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 };
        }
        return c;
      })
    );
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `c${Date.now()}`,
      user: {
        name: 'Elena Rodriguez',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
        role: 'Senior Project Manager',
      },
      text: newComment.trim(),
      timeAgo: 'Just now',
      likes: 0,
      liked: false,
      replies: [],
    };
    setComments((prev) => [comment, ...prev]);
    setNewComment('');
  };

  const sorted = [...comments].sort((a, b) =>
    sortBy === 'top' ? b.likes - a.likes : 0
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-wp-on-surface">Discussion</h3>
          <span className="text-xs font-medium text-wp-on-surface-variant bg-wp-surface-container-high
            px-2.5 py-1 rounded-full">
            {totalCount} comments
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(['top', 'newest'] as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${sortBy === opt
                  ? 'bg-wp-primary-container/15 text-wp-primary'
                  : 'text-wp-on-surface-variant hover:bg-wp-surface-container-high'
                }`}
            >
              {opt === 'top' ? 'Top' : 'Newest'}
            </button>
          ))}
        </div>
      </div>

      {/* New comment input */}
      <div className="flex gap-3">
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elena"
          alt="You"
          className="w-10 h-10 rounded-full bg-wp-surface-container-high flex-shrink-0"
        />
        <div className="flex-1 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Add a comment..."
            rows={1}
            className="w-full px-4 py-3 pr-24 bg-wp-surface-container-low rounded-xl text-sm text-wp-on-surface
              placeholder-wp-outline focus:outline-none focus:bg-wp-surface-container
              focus:shadow-wp-glow transition-all resize-none"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button className="p-1.5 rounded-lg text-wp-on-surface-variant hover:text-wp-on-surface
              hover:bg-wp-surface-container-high transition-colors">
              <SmilePlus size={16} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="p-1.5 rounded-lg text-wp-primary hover:bg-wp-primary-container/15
                transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Comment list */}
      <div className="space-y-1">
        {sorted.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            expanded={expandedReplies.has(comment.id)}
            onToggleReplies={() => toggleReplies(comment.id)}
            onToggleLike={(id, parentId) => toggleLike(id, parentId)}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Single Comment Item ── */

interface CommentItemProps {
  comment: Comment;
  expanded?: boolean;
  onToggleReplies?: () => void;
  onToggleLike: (id: string, parentId?: string) => void;
  parentId?: string;
  isReply?: boolean;
}

function CommentItem({ comment, expanded, onToggleReplies, onToggleLike, parentId, isReply }: CommentItemProps) {
  return (
    <div className={`group ${isReply ? 'ml-12' : ''}`}>
      <div className={`flex gap-3 p-3 rounded-xl transition-colors
        ${isReply ? '' : 'hover:bg-wp-surface-container-low/50'}`}>
        <img
          src={comment.user.avatar}
          alt={comment.user.name}
          className={`rounded-full bg-wp-surface-container-high flex-shrink-0 ${isReply ? 'w-8 h-8' : 'w-10 h-10'}`}
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Author line */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-wp-on-surface">{comment.user.name}</span>
            {comment.user.role && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                ${comment.user.role === 'Instructor'
                  ? 'bg-wp-primary-container/20 text-wp-primary'
                  : 'bg-wp-surface-container-high text-wp-on-surface-variant'
                }`}>
                {comment.user.role}
              </span>
            )}
            <span className="text-[11px] text-wp-outline">{comment.timeAgo}</span>
          </div>

          {/* Text */}
          <p className="text-sm text-wp-on-surface-variant leading-relaxed">{comment.text}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={() => onToggleLike(comment.id, parentId)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors
                ${comment.liked
                  ? 'text-wp-primary'
                  : 'text-wp-on-surface-variant hover:text-wp-on-surface'
                }`}
            >
              <ThumbsUp size={14} className={comment.liked ? 'fill-current' : ''} />
              {comment.likes > 0 && comment.likes}
            </button>
            <button className="flex items-center gap-1.5 text-xs font-medium
              text-wp-on-surface-variant hover:text-wp-on-surface transition-colors">
              <ThumbsDown size={14} />
            </button>
            <button className="text-xs font-semibold text-wp-on-surface-variant hover:text-wp-on-surface transition-colors">
              Reply
            </button>
            <button className="text-wp-on-surface-variant hover:text-wp-on-surface transition-colors
              opacity-0 group-hover:opacity-100">
              <MoreVertical size={14} />
            </button>
          </div>

          {/* Replies toggle */}
          {!isReply && comment.replies.length > 0 && (
            <button
              onClick={onToggleReplies}
              className="flex items-center gap-1.5 text-xs font-bold text-wp-primary hover:text-wp-primary-fixed
                transition-colors mt-1"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <MessageSquare size={13} />
              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* Expanded replies */}
      {expanded && comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          onToggleLike={onToggleLike}
          parentId={comment.id}
          isReply
        />
      ))}
    </div>
  );
}
