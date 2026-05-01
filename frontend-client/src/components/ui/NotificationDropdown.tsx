import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Megaphone, BookOpen, AlertCircle, Info, Circle, Loader2 } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import type { Notification } from '../../types';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Subscribe to global store
  const {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
  } = useNotificationStore();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingMore || !hasMore) return;

    // Trigger load when user scrolls within 50px of the bottom
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      loadMore();
    }
  }, [loadingMore, hasMore, loadMore]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'training':
        return <BookOpen size={16} className="text-wp-primary" />;
      case 'townhall':
        return <Megaphone size={16} className="text-blue-500" />;
      case 'course_update':
        return <Info size={16} className="text-green-500" />;
      case 'system':
        return <AlertCircle size={16} className="text-orange-500" />;
      default:
        return <Bell size={16} className="text-wp-on-surface-variant" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          isOpen ? 'bg-wp-surface-container-high' : 'hover:bg-wp-surface-container-high'
        }`}
      >
        <Bell size={20} className="text-wp-on-surface-variant" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-wp-primary text-[10px] font-bold text-white rounded-full border-2 border-wp-surface shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-wp-surface-container-high rounded-wp-lg shadow-wp-ambient z-50 overflow-hidden border border-wp-outline/10 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-wp-outline/10">
            <h3 className="text-sm font-semibold text-wp-on-surface">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs text-wp-primary font-normal">
                  ({unreadCount} unread)
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-wp-primary hover:text-wp-primary-fixed transition-colors flex items-center gap-1"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-[400px] overflow-y-auto"
          >
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-wp-on-surface-variant">
                <div className="w-5 h-5 border-2 border-wp-primary/30 border-t-wp-primary rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-wp-on-surface-variant">
                <Bell size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium text-wp-on-surface mb-1">All caught up!</p>
                <p className="text-xs">You have no new notifications.</p>
              </div>
            ) : (
              <div className="divide-y divide-wp-outline/5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 flex gap-3 hover:bg-wp-surface-bright transition-colors cursor-pointer ${
                      !notification.read ? 'bg-wp-surface-bright/40' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-wp-surface-lowest flex items-center justify-center border border-wp-outline/5 shadow-sm">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <p className={`text-sm font-semibold truncate ${
                          !notification.read ? 'text-wp-on-surface' : 'text-wp-on-surface-variant/80'
                        }`}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-wp-outline shrink-0 whitespace-nowrap mt-0.5">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${
                        !notification.read ? 'text-wp-on-surface-variant' : 'text-wp-outline'
                      }`}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="shrink-0 p-1.5 rounded-full text-wp-primary/40 hover:text-wp-primary hover:bg-wp-primary/10 transition-colors self-center"
                        title="Mark as read"
                      >
                        <Circle size={10} className="fill-current" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Infinite scroll loader */}
                {loadingMore && (
                  <div className="py-3 flex items-center justify-center gap-2 text-wp-on-surface-variant">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs">Loading more...</span>
                  </div>
                )}
                
                {!hasMore && notifications.length > 0 && (
                  <div className="py-3 text-center text-xs text-wp-outline">
                    No more notifications
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
