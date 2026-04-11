import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      try {
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken
        });
        
        localStorage.setItem('access_token', response.data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        
        return api(originalRequest);
      } catch (err) {
        // Refresh token failed, meaning the user needs to log in again
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// API Functions

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/auth/login/`, { username, password });
  return response.data;
};

export const fetchDashboardStats = async () => {
  const response = await api.get('/analytics/dashboard/');
  return response.data;
};

export const fetchLogs = async (params = {}) => {
  const response = await api.get('/logs/', { params });
  return response.data;
};

export const fetchAlerts = async (params = {}) => {
  const response = await api.get('/alerts/', { params });
  return response.data;
};

export const acknowledgeAlert = async (id) => {
  const response = await api.post(`/alerts/${id}/acknowledge/`);
  return response.data;
};

export const resolveAlert = async (id, notes = '') => {
  const response = await api.post(`/alerts/${id}/resolve/`, { notes });
  return response.data;
};

export const fetchLogSources = async () => {
    const response = await api.get('/logs/sources/');
    return response.data;
};

export default api;
