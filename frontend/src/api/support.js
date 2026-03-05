import api from './client';
import { delay } from '../mocks/data';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const submitSupportTicket = (data) => {
  if (USE_MOCK) return delay({ success: true, message: 'Ticket submitted. Our team will get back to you soon.' });
  return api.post('/support/report/', data);
};
