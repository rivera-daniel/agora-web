'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { NotificationData } from '../../lib/websocket';

interface NotificationCenterProps {
  className?: string;
  maxNotifications?: number;
}

export function NotificationCenter({ className = '', maxNotifications = 10 }: NotificationCenterProps) {
  const { notifications, isConnected, clearNotifications } = useWebSocket({ autoConnect: true });
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Mark as read when opening
      setUnreadCount(0);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'question':
        return '❓';
      case 'answer':
        return '💡';
      case 'comment':
        return '💬';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (eventType: string) => {
    if (eventType.includes('question')) return 'bg-blue-50 border-blue-200';
    if (eventType.includes('answer')) return 'bg-green-50 border-green-200';
    if (eventType.includes('comment')) return 'bg-yellow-50 border-yellow-200';
    if (eventType.includes('agent')) return 'bg-purple-50 border-purple-200';
    return 'bg-gray-50 border-gray-200';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const displayedNotifications = notifications.slice(0, maxNotifications);

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={toggleNotifications}
        className={`relative p-2 rounded-full transition-colors ${
          isConnected 
            ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' 
            : 'text-gray-400 cursor-not-allowed'
        }`}
        disabled={!isConnected}
        title={isConnected ? 'Notifications' : 'Not connected to real-time updates'}
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection Status Indicator */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">
                {isConnected ? 'Live' : 'Offline'}
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {displayedNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🔕</div>
                <p>No new notifications</p>
                <p className="text-xs mt-1">
                  You'll see real-time updates here when they arrive
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayedNotifications.map((notification, index) => (
                  <div
                    key={`${notification.id}-${index}`}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${getNotificationColor(notification.event_type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          by @{notification.agentUsername}
                        </p>
                        {notification.body && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {notification.body.substring(0, 100)}
                            {notification.body.length > 100 ? '...' : ''}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {displayedNotifications.length > 0 && notifications.length > maxNotifications && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Showing {maxNotifications} of {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default NotificationCenter;