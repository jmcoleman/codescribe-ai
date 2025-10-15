import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, AlertCircle, AlertTriangle, Info, Trash2, Archive } from 'lucide-react';

/**
 * Toast History/Notification Center Component
 *
 * Enterprise-grade notification center that tracks all toast notifications
 * and allows users to review, manage, and act on past notifications.
 *
 * Features:
 * - Persistent notification history
 * - Filter by type (success, error, warning, info)
 * - Mark as read/unread
 * - Clear individual or all notifications
 * - Archive notifications
 * - Timestamp tracking
 * - Unread badge counter
 *
 * @example
 * import { ToastHistory, useToastHistory } from './components/toast/ToastHistory';
 *
 * function App() {
 *   const { addToHistory } = useToastHistory();
 *
 *   useEffect(() => {
 *     // Automatically track all toasts
 *     addToHistory({
 *       id: '1',
 *       type: 'success',
 *       title: 'Upload Complete',
 *       message: 'File uploaded successfully',
 *       timestamp: Date.now()
 *     });
 *   }, []);
 *
 *   return (
 *     <>
 *       <ToastHistory />
 *       {/ * Your app * /}
 *     </>
 *   );
 * }
 */

// Toast history store (singleton pattern for global state)
class ToastHistoryStore {
  constructor() {
    this.notifications = [];
    this.listeners = new Set();
    this.maxHistory = 100; // Maximum notifications to keep

    // Load from localStorage
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('toast-history');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load toast history:', error);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('toast-history', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save toast history:', error);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.notifications));
  }

  add(notification) {
    const newNotification = {
      ...notification,
      id: notification.id || `toast-${Date.now()}-${Math.random()}`,
      timestamp: notification.timestamp || Date.now(),
      read: false,
      archived: false,
    };

    this.notifications.unshift(newNotification);

    // Keep only maxHistory notifications
    if (this.notifications.length > this.maxHistory) {
      this.notifications = this.notifications.slice(0, this.maxHistory);
    }

    this.saveToStorage();
    this.notify();
  }

  markAsRead(id) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.notify();
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.saveToStorage();
    this.notify();
  }

  remove(id) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveToStorage();
    this.notify();
  }

  clear() {
    this.notifications = [];
    this.saveToStorage();
    this.notify();
  }

  archive(id) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.archived = true;
      notification.read = true;
      this.saveToStorage();
      this.notify();
    }
  }

  getUnreadCount() {
    return this.notifications.filter((n) => !n.read && !n.archived).length;
  }

  getNotifications(options = {}) {
    let filtered = [...this.notifications];

    if (options.type) {
      filtered = filtered.filter((n) => n.type === options.type);
    }

    if (options.hideArchived) {
      filtered = filtered.filter((n) => !n.archived);
    }

    if (options.unreadOnly) {
      filtered = filtered.filter((n) => !n.read);
    }

    return filtered;
  }
}

// Singleton instance
const toastHistoryStore = new ToastHistoryStore();

/**
 * Custom hook to interact with toast history
 */
export const useToastHistory = () => {
  const [notifications, setNotifications] = useState(toastHistoryStore.notifications);

  useEffect(() => {
    const unsubscribe = toastHistoryStore.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  return {
    notifications,
    addToHistory: (notification) => toastHistoryStore.add(notification),
    markAsRead: (id) => toastHistoryStore.markAsRead(id),
    markAllAsRead: () => toastHistoryStore.markAllAsRead(),
    remove: (id) => toastHistoryStore.remove(id),
    clear: () => toastHistoryStore.clear(),
    archive: (id) => toastHistoryStore.archive(id),
    getUnreadCount: () => toastHistoryStore.getUnreadCount(),
    getNotifications: (options) => toastHistoryStore.getNotifications(options),
  };
};

/**
 * Toast History Panel Component
 */
export const ToastHistory = ({ defaultOpen = false, position = 'right' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [filter, setFilter] = useState('all'); // all, success, error, warning, info
  const [hideArchived, setHideArchived] = useState(true);
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    remove,
    clear,
    archive,
    getUnreadCount,
    getNotifications,
  } = useToastHistory();

  const unreadCount = getUnreadCount();

  const filteredNotifications = getNotifications({
    type: filter !== 'all' ? filter : undefined,
    hideArchived,
  });

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    info: {
      icon: Info,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-20 z-40 bg-white hover:bg-slate-50 text-slate-700 rounded-full p-3 shadow-lg border-2 border-slate-200 transition-all duration-200 hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
        aria-label="Open notification center"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className={`fixed top-0 ${position}-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-center-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-slate-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div>
                <h2
                  id="notification-center-title"
                  className="text-lg font-bold text-slate-900 flex items-center gap-2"
                >
                  <Bell className="h-5 w-5 text-purple-600" />
                  Notifications
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                aria-label="Close notification center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'success', 'error', 'warning', 'info'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-150 ${
                      filter === type
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideArchived}
                    onChange={(e) => setHideArchived(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-600"
                  />
                  Hide archived
                </label>
              </div>
            </div>

            {/* Actions */}
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-b border-slate-200 bg-white flex items-center gap-2">
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:underline"
                >
                  Mark all as read
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={clear}
                  className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear all
                </button>
              </div>
            )}

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                  <Bell className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredNotifications.map((notification) => {
                    const config = typeConfig[notification.type] || typeConfig.info;
                    const Icon = config.icon;

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-slate-50 transition-colors ${
                          !notification.read ? 'bg-purple-50 bg-opacity-30' : ''
                        } ${notification.archived ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`flex-shrink-0 ${config.bgColor} rounded-lg p-2 mt-0.5`}>
                            <Icon className={`h-4 w-4 ${config.iconColor}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {notification.title && (
                              <p className="text-sm font-semibold text-slate-900 mb-0.5">
                                {notification.title}
                              </p>
                            )}
                            {notification.message && (
                              <p className="text-sm text-slate-600 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-purple-600 hover:text-purple-700 p-1 rounded hover:bg-purple-50 transition-colors"
                                aria-label="Mark as read"
                                title="Mark as read"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}
                            {!notification.archived && (
                              <button
                                onClick={() => archive(notification.id)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
                                aria-label="Archive"
                                title="Archive"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => remove(notification.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                              aria-label="Delete"
                              title="Delete"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

/**
 * Auto-track toast notifications
 * This component listens to toast events and automatically adds them to history
 */
export const ToastHistoryTracker = () => {
  const { addToHistory } = useToastHistory();

  useEffect(() => {
    // Listen for custom toast events
    const handleToastEvent = (event) => {
      const { detail } = event;
      if (detail) {
        addToHistory(detail);
      }
    };

    window.addEventListener('toast-notification', handleToastEvent);

    return () => {
      window.removeEventListener('toast-notification', handleToastEvent);
    };
  }, [addToHistory]);

  return null;
};

/**
 * Helper function to emit toast events for tracking
 * Use this in your toast utility functions to automatically track toasts
 *
 * @example
 * export const toastSuccess = (message, options = {}) => {
 *   const id = toast.success(message, { ...DEFAULT_OPTIONS, ...options });
 *   emitToastEvent({ id, type: 'success', message, title: message });
 *   return id;
 * };
 */
export const emitToastEvent = (notification) => {
  const event = new CustomEvent('toast-notification', { detail: notification });
  window.dispatchEvent(event);
};

export default ToastHistory;
