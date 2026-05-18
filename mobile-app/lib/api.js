import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.31.19:8000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 30000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('hn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const detail = err.response?.data?.detail || err.response?.data;
    return Promise.reject({
      message: detail?.message || detail?.detail || 'Network error',
      code: detail?.code || 'UNKNOWN',
      status: err.response?.status,
    });
  }
);

// Auth
export const authApi = {
  login: d => api.post('/auth/login', d),
  register: d => api.post('/auth/register', d),
};

// Phase 1
export const symptomChatApi = { send: d => api.post('/symptom/chat', d) };
export const symptomsApi = { list: () => api.get('/symptoms/list'), analyze: d => api.post('/symptoms/analyze', d) };
export const reportApi = { generate: d => api.post('/report/generate', d), history: () => api.get('/report/history') };
export const medicinesApi = { create: d => api.post('/medicines/reminder', d), list: () => api.get('/medicines/reminders'), delete: id => api.delete(`/medicines/reminder/${id}`) };
export const profileApi = { get: () => api.get('/profile'), update: d => api.put('/profile', d) };
export const planApi = { status: () => api.get('/plan/status'), upgrade: d => api.post('/plan/upgrade', d) };

// Phase 2
export const goalsApi = {
  list: () => api.get('/v2/goals'),
  create: d => api.post('/v2/goals', d),
  log: (id, d) => api.post(`/v2/goals/${id}/log`, d),
  delete: id => api.delete(`/v2/goals/${id}`),
};

export const medicalApi = {
  list: () => api.get('/v2/medical-history'),
  create: d => api.post('/v2/medical-history', d),
  delete: id => api.delete(`/v2/medical-history/${id}`),
};

export const labApi = {
  list: () => api.get('/v2/lab-results'),
  create: d => api.post('/v2/lab-results', d),
  delete: id => api.delete(`/v2/lab-results/${id}`),
};

export const insuranceApi = {
  get: () => api.get('/v2/insurance'),
  create: d => api.post('/v2/insurance', d),
  addClaim: (id, d) => api.post(`/v2/insurance/${id}/claims`, d),
};

export const remindersApi = {
  list: () => api.get('/v2/reminders'),
  create: d => api.post('/v2/reminders', d),
  complete: id => api.patch(`/v2/reminders/${id}/complete`),
  delete: id => api.delete(`/v2/reminders/${id}`),
};

export const emergencyApi = {
  get: () => api.get('/v2/emergency-profile'),
  upsert: d => api.put('/v2/emergency-profile', d),
};

export const inventoryApi = {
  list: () => api.get('/v2/medication-inventory'),
  create: d => api.post('/v2/medication-inventory', d),
  restock: (id, qty) => api.patch(`/v2/medication-inventory/${id}/restock?quantity=${qty}`),
  delete: id => api.delete(`/v2/medication-inventory/${id}`),
};

export const exportApi = {
  download: (modules = 'all') => api.get(`/v2/export?modules=${modules}`),
};

export default api;
