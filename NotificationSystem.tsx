import React from 'react';
import { useNotifications } from '../store/uiStore'; // Assuming a store hook

/**
 * A global notification system that uses an ARIA live region to announce
 * new notifications to screen readers.
 */
export function NotificationSystem() {
  const { notifications, dismissNotification } = useNotifications();

  if (!notifications.length) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-50 space-y-2"
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          role="status"
          className="p-4 bg-indigo-600 text-white rounded-md shadow-lg flex items-center justify-between"
        >
          <p>{notification.message}</p>
          <button
            onClick={() => dismissNotification(notification.id)}
            aria-label={`Dismiss notification: ${notification.message}`}
            className="ml-4 p-1 rounded-full hover:bg-indigo-700"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}