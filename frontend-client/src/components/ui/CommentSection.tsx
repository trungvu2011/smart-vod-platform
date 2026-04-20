import { useState, useEffect } from "react";
import {
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Send,
  SmilePlus,
} from "lucide-react";
import { commentApi } from "../../api/commentApi";
import { useAuthStore } from "../../store/useAuthStore";
import type { Comment } from "../../types";

interface CommentWithReplies extends Comment {
  replies?: CommentWithReplies[];
  liked?: boolean;
  likes?: number;
}

type SortOption = "top" | "newest";

interface CommentSectionProps {
  videoId?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (h < 1) return `${m} minutes ago`;
  if (d < 1) return `${h} hours ago`;
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

export default function CommentSection({ videoId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (videoId) {
      loadComments();
    }
  }, [videoId]);

  const loadComments = async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const data = await commentApi.getComments(videoId);
      setComments(data as CommentWithReplies[]);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoading(false);
    }
  };

  // We calculate total count of top-level + nested
  const totalCount = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0),
    0,
  );

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

  const handleSubmit = async () => {
    if (!newComment.trim() || !videoId) return;
    try {
      const res = await commentApi.addComment(videoId, newComment.trim());
      setComments([res as CommentWithReplies, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim() || !videoId) return;
    try {
      const res = await commentApi.addComment(
        videoId,
        replyContent.trim(),
        parentId,
      );
      // Update local state to include reply
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), res as CommentWithReplies],
            };
          }
          return c;
        }),
      );
      setReplyContent("");
      setReplyingTo(null);
      // Expand replies for this parent so user can see it
      setExpandedReplies((prev) => new Set(prev).add(parentId));
    } catch (err) {
      console.error("Failed to post reply", err);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!videoId || !isAuthenticated) return;

    try {
      const res = await commentApi.toggleCommentLike(videoId, commentId);

      const updateLikeState = (
        nodes: CommentWithReplies[],
      ): CommentWithReplies[] =>
        nodes.map((node) => {
          if (node.id === commentId) {
            return {
              ...node,
              liked: res.liked,
              likes: res.likes,
            };
          }

          if (node.replies && node.replies.length > 0) {
            return {
              ...node,
              replies: updateLikeState(node.replies),
            };
          }

          return node;
        });

      setComments((prev) => updateLikeState(prev));
    } catch (err) {
      console.error("Failed to toggle comment like", err);
    }
  };

  const sorted = [...comments].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // We don't have real "likes" count tied directly to comments yet, only _count.replies maybe
    // Fallback to newest if no likes count is present
    return 0;
  });

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-wp-on-surface">Discussion</h3>
          <span
            className="text-xs font-medium text-wp-on-surface-variant bg-wp-surface-container-high
            px-2.5 py-1 rounded-full"
          >
            {totalCount} comments
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(["top", "newest"] as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${
                  sortBy === opt
                    ? "bg-wp-primary-container/15 text-wp-primary"
                    : "text-wp-on-surface-variant hover:bg-wp-surface-container-high"
                }`}
            >
              {opt === "top" ? "Top" : "Newest"}
            </button>
          ))}
        </div>
      </div>

      {/* New comment input */}
      {isAuthenticated ? (
        <div className="flex gap-3">
          <img
            src={
              user?.avatarUrl ||
              `https://ui-avatars.com/api/?name=${user?.fullName}`
            }
            alt="You"
            className="w-10 h-10 rounded-full bg-wp-surface-container-high flex-shrink-0"
          />
          <div className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
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
              <button
                className="p-1.5 rounded-lg text-wp-on-surface-variant hover:text-wp-on-surface
                hover:bg-wp-surface-container-high transition-colors"
              >
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
      ) : (
        <div className="p-4 rounded-xl bg-wp-surface-container-low text-center text-sm text-wp-on-surface-variant">
          Please log in to join the discussion.
        </div>
      )}

      {/* Comment list */}
      <div className="space-y-1">
        {loading ? (
          <div className="p-4 text-center text-wp-on-surface-variant text-sm animate-pulse">
            Loading comments...
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-4 text-center text-wp-on-surface-variant text-sm">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          sorted.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onToggleLike={handleToggleCommentLike}
              expanded={expandedReplies.has(comment.id)}
              onToggleReplies={() => toggleReplies(comment.id)}
              onReply={() =>
                setReplyingTo(replyingTo === comment.id ? null : comment.id)
              }
              replyingTo={replyingTo === comment.id}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={() => handleReplySubmit(comment.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

/* ── Single Comment Item ── */

interface CommentItemProps {
  comment: CommentWithReplies;
  onToggleLike: (commentId: string) => Promise<void>;
  expanded?: boolean;
  onToggleReplies?: () => void;
  onReply?: () => void;
  replyingTo?: boolean;
  replyContent?: string;
  setReplyContent?: (val: string) => void;
  onSubmitReply?: () => void;
  parentId?: string;
  isReply?: boolean;
}

function CommentItem({
  comment,
  onToggleLike,
  expanded,
  onToggleReplies,
  onReply,
  replyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  isReply,
}: CommentItemProps) {
  const { isAuthenticated, user } = useAuthStore();
  const userName = comment.user?.fullName || "Unknown User";
  const userAvatar =
    comment.user?.avatarUrl || `https://ui-avatars.com/api/?name=${userName}`;
  const isLiked = !!comment.liked;
  const likeCount = comment.likes ?? comment._count?.likes ?? 0;
  // We don't have roles embedded directly in `comment.user` unless we update backend join, so we omit role badge or hardcode

  return (
    <div className={`group ${isReply ? "ml-12" : ""}`}>
      <div
        className={`flex gap-3 p-3 rounded-xl transition-colors
        ${isReply ? "" : "hover:bg-wp-surface-container-low/50"}`}
      >
        <img
          src={userAvatar}
          alt={userName}
          className={`rounded-full bg-wp-surface-container-high object-cover flex-shrink-0 ${isReply ? "w-8 h-8" : "w-10 h-10"}`}
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Author line */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-wp-on-surface">
              {userName}
            </span>
            <span className="text-[11px] text-wp-outline">
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Text */}
          <p className="text-sm text-wp-on-surface-variant leading-relaxed">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={() => onToggleLike(comment.id)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                isLiked
                  ? "text-wp-primary"
                  : "text-wp-on-surface-variant hover:text-wp-on-surface"
              }`}
            >
              <ThumbsUp size={14} className={isLiked ? "fill-current" : ""} />
              <span>{likeCount}</span>
            </button>
            {!isReply && isAuthenticated && onReply && (
              <button
                onClick={onReply}
                className="text-xs font-semibold text-wp-on-surface-variant hover:text-wp-on-surface transition-colors"
              >
                Reply
              </button>
            )}
            <button className="text-wp-on-surface-variant hover:text-wp-on-surface transition-colors opacity-0 group-hover:opacity-100">
              <MoreVertical size={14} />
            </button>
          </div>

          {/* Reply input box */}
          {replyingTo && setReplyContent && onSubmitReply && (
            <div className="mt-3 flex gap-2">
              <img
                src={
                  user?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${user?.fullName}`
                }
                alt="You"
                className="w-8 h-8 rounded-full bg-wp-surface-container-high object-cover flex-shrink-0"
              />
              <div className="flex-1 relative">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSubmitReply();
                    }
                  }}
                  autoFocus
                  placeholder="Write a reply..."
                  rows={1}
                  className="w-full px-3 py-2 pr-12 bg-wp-surface-container-low rounded-lg text-sm text-wp-on-surface
                    placeholder-wp-outline focus:outline-none focus:bg-wp-surface-container
                    focus:shadow-wp-glow transition-all resize-none"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={onSubmitReply}
                    disabled={!replyContent?.trim()}
                    className="p-1.5 rounded-lg text-wp-primary hover:bg-wp-primary-container/15
                      transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Replies toggle */}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <button
              onClick={onToggleReplies}
              className="flex items-center gap-1.5 text-xs font-bold text-wp-primary hover:text-wp-primary-fixed
                transition-colors mt-1"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <MessageSquare size={13} />
              {comment.replies.length}{" "}
              {comment.replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
      </div>

      {/* Expanded replies */}
      {expanded &&
        comment.replies?.map((reply) => (
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
