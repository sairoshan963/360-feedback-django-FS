import api from './client';
import { delay, NOTIFICATIONS } from '../mocks/data';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const getNotifications = () => {
  if (USE_MOCK) return delay({ success: true, notifications: NOTIFICATIONS });
  return api.get('/notifications/');
};

export const getUnreadCount = () => {
  if (USE_MOCK) {
    const count = NOTIFICATIONS.filter((n) => !n.is_read).length;
    return delay({ success: true, count });
  }
  return api.get('/notifications/unread-count/');
};

export const markAsRead = (id) => {
  if (USE_MOCK) return delay({ success: true });
  return api.patch(`/notifications/${id}/read/`);
};

export const markAllAsRead = () => {
  if (USE_MOCK) return delay({ success: true });
  return api.post('/notifications/mark-all-read/');
};
