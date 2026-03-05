import api from './client';
import { delay, MY_TASKS } from '../mocks/data';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const getMyTasks = () => {
  if (USE_MOCK) return delay({ success: true, tasks: MY_TASKS });
  return api.get('/tasks/');
};

export const getTask = (id) => {
  if (USE_MOCK) {
    const task = MY_TASKS.find((t) => t.id === id);
    return delay({ success: true, task: task || MY_TASKS[0] });
  }
  return api.get(`/tasks/${id}/`);
};

export const saveDraft = (id, payload) => {
  if (USE_MOCK) return delay({ success: true, message: 'Draft saved.' });
  return api.post(`/tasks/${id}/draft/`, payload);
};

export const submitTask = (id, answers) => {
  if (USE_MOCK) return delay({ success: true, message: 'Feedback submitted.' });
  return api.post(`/feedback/tasks/${id}/submit/`, { answers });
};
