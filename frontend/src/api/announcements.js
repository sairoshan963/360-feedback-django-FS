import api from './client';
import { delay, ANNOUNCEMENTS } from '../mocks/data';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const getActiveAnnouncements = () => {
  if (USE_MOCK) {
    const active = ANNOUNCEMENTS.filter((a) => a.is_active);
    return delay({ success: true, announcements: active });
  }
  return api.get('/announcements/');
};

export const getAllAnnouncements = () => {
  if (USE_MOCK) return delay({ success: true, announcements: ANNOUNCEMENTS });
  return api.get('/announcements/all/');
};

export const createAnnouncement = (data) => {
  if (USE_MOCK) return delay({ success: true, announcement: { id: 'ann-new', is_active: true, created_at: new Date().toISOString(), ...data } });
  return api.post('/announcements/', data);
};

export const deactivateAnnouncement = (id) => {
  if (USE_MOCK) return delay({ success: true });
  return api.patch(`/announcements/${id}/deactivate/`);
};

export const deleteAnnouncement = (id) => {
  if (USE_MOCK) return delay({ success: true });
  return api.delete(`/announcements/${id}/`);
};
