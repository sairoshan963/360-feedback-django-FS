import api from './client';

// ─── Templates ────────────────────────────────────────────────────────────────
export const listClientFeedbackTemplates = () =>
  api.get('/client-feedback/templates/');

export const getClientFeedbackTemplate = (id) =>
  api.get(`/client-feedback/templates/${id}/`);

export const createClientFeedbackTemplate = (data) =>
  api.post('/client-feedback/templates/', data);

export const updateClientFeedbackTemplate = (id, data) =>
  api.put(`/client-feedback/templates/${id}/`, data);

export const deleteClientFeedbackTemplate = (id) =>
  api.delete(`/client-feedback/templates/${id}/`);

// ─── Requests ─────────────────────────────────────────────────────────────────
export const listClientFeedbackRequests = () =>
  api.get('/client-feedback/');

export const getClientFeedbackRequest = (id) =>
  api.get(`/client-feedback/${id}/`);

export const createClientFeedbackRequest = (data) =>
  api.post('/client-feedback/', data);

export const deleteClientFeedbackRequest = (id) =>
  api.delete(`/client-feedback/${id}/`);

export const resendClientFeedbackRequest = (id, data = {}) =>
  api.post(`/client-feedback/${id}/resend/`, data);

// ─── Public (no auth token) ───────────────────────────────────────────────────
const PUBLIC_BASE = '/api/v1/client-feedback';

export const getPublicForm = (token) =>
  fetch(`${PUBLIC_BASE}/form/${token}/`).then((r) => r.json());

export const submitPublicForm = (token, data) =>
  fetch(`${PUBLIC_BASE}/form/${token}/submit/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  }).then((r) => r.json());
