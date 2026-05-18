/**
 * Centralized API client.
 * - Single base URL from env
 * - Auto JWT attachment
 * - Global error handling
 * - Standard response/error shape
 */
import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail || err.response?.data;
    const status = err.response?.status;

    if (status === 401 && detail?.code === 'TOKEN_EXPIRED') {
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (status === 429 && detail?.code === 'USAGE_LIMIT') {
      window.dispatchEvent(new CustomEvent('usage-limit-hit', { detail }));
    }

    // Normalize error
    const normalized = {
      message: detail?.message || detail?.detail || 'Something went wrong',
      code: detail?.code || 'UNKNOWN',
      status,
      raw: detail,
    };
    return Promise.reject(normalized);
  }
);

// ── Auth ─────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Symptoms (CORE) ──────────────────────────────
export const symptomChatApi = {
  send: (data) => api.post('/symptom/chat', data),
};

export const symptomsApi = {
  list: () => api.get('/symptoms/list'),
  analyze: (data) => api.post('/symptoms/analyze', data),
  history: () => api.get('/symptoms/history'),
};

// ── Health Report ────────────────────────────────
export const reportApi = {
  generate: (data) => api.post('/report/generate', data),
  history: () => api.get('/report/history'),
};

// ── Medicines ────────────────────────────────────
export const medicinesApi = {
  create: (data) => api.post('/medicines/reminder', data),
  list: () => api.get('/medicines/reminders'),
  delete: (id) => api.delete(`/medicines/reminder/${id}`),
};

// ── Profile ──────────────────────────────────────
export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
};

// ── Plan / Usage ─────────────────────────────────
export const planApi = {
  status: () => api.get('/plan/status'),
  pricing: () => api.get('/plan/pricing'),
  upgrade: (data) => api.post('/plan/upgrade', data)
};

// ── Phase 2 (New Routes) ─────────────────────────
export const goalsApi = {
  list: () => api.get('/v2/goals'),
  create: (data) => api.post('/v2/goals', data),
  log: (id, data) => api.post(`/v2/goals/${id}/log`, data),
  delete: (id) => api.delete(`/v2/goals/${id}`),
};

export const medicalApi = {
  list: () => api.get('/v2/medical-history'),
  create: (data) => api.post('/v2/medical-history', data),
  delete: (id) => api.delete(`/v2/medical-history/${id}`),
};

export const labApi = {
  list: () => api.get('/v2/lab-results'),
  create: (data) => api.post('/v2/lab-results', data),
  delete: (id) => api.delete(`/v2/lab-results/${id}`),
};

export const insuranceApi = {
  get: () => api.get('/v2/insurance'),
  create: (data) => api.post('/v2/insurance', data),
  addClaim: (id, data) => api.post(`/v2/insurance/${id}/claims`, data),
};

export const remindersApi = {
  list: () => api.get('/v2/reminders'),
  create: (data) => api.post('/v2/reminders', data),
  complete: (id) => api.patch(`/v2/reminders/${id}/complete`),
  delete: (id) => api.delete(`/v2/reminders/${id}`),
};

export const emergencyApi = {
  get: () => api.get('/v2/emergency-profile'),
  upsert: (data) => api.put('/v2/emergency-profile', data),
};

export const inventoryApi = {
  list: () => api.get('/v2/medication-inventory'),
  create: (data) => api.post('/v2/medication-inventory', data),
  restock: (id, qty) => api.patch(`/v2/medication-inventory/${id}/restock?quantity=${qty}`),
  delete: (id) => api.delete(`/v2/medication-inventory/${id}`),
};