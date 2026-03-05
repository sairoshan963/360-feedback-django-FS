import api from './client';
import { delay, MOCK_USERS_BY_EMAIL } from '../mocks/data';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Mock token stored in module scope so getMe() can reference it
let _mockUser = null;

export const login = (email, password) => {
  if (USE_MOCK) {
    const user = MOCK_USERS_BY_EMAIL[email];
    if (!user) return Promise.reject({ response: { data: { detail: 'Invalid credentials.' } } });
    _mockUser = user;
    localStorage.setItem('access_token', 'mock-access-token');
    localStorage.setItem('refresh_token', 'mock-refresh-token');
    return delay({ success: true, access: 'mock-access-token', refresh: 'mock-refresh-token', user });
  }
  return api.post('/auth/login/', { email, password });
};

export const getMe = () => {
  if (USE_MOCK) {
    const user = _mockUser || Object.values(MOCK_USERS_BY_EMAIL)[3]; // default to employee
    return delay({ success: true, user });
  }
  return api.get('/auth/me/');
};

export const logout = () => {
  if (USE_MOCK) {
    _mockUser = null;
    return delay({ success: true });
  }
  return api.post('/auth/logout/');
};

export const updateMe = (data) => {
  if (USE_MOCK) return delay({ success: true, user: { ..._mockUser, ...data } });
  return api.patch('/auth/me/profile/', data);
};

export const changePassword = (data) => {
  if (USE_MOCK) return delay({ success: true, message: 'Password updated.' });
  return api.post('/auth/me/password/', data);
};

export const uploadAvatar = (file) => {
  if (USE_MOCK) return delay({ success: true, avatar_url: null });
  const formData = new FormData();
  formData.append('avatar', file);
  return api.post('/auth/me/avatar/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const removeAvatar = () => {
  if (USE_MOCK) return delay({ success: true });
  return api.delete('/auth/me/avatar/');
};

export const forgotPassword = (email) => {
  if (USE_MOCK) return delay({ success: true, message: 'Reset link sent.' });
  return api.post('/auth/forgot-password/', { email });
};

export const resetPassword = (token, new_password) => {
  if (USE_MOCK) return delay({ success: true, message: 'Password reset successful.' });
  return api.post('/auth/reset-password/', { token, new_password });
};

export const googleAuth = (code) => {
  if (USE_MOCK) return delay({ success: false });
  return api.post('/auth/google/', { code });
};
