import axios from 'axios';

// Next.js এ frontend ও backend একই origin-এ থাকে, তাই relative '/api' যথেষ্ট।
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PUBLIC_PATHS = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];

const isPublicPath = () =>
  typeof window !== 'undefined' && PUBLIC_PATHS.some(path => window.location.pathname.startsWith(path));

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      if (!isPublicPath()) {
        window.location.href = '/login';
      }
    }
    if (!err.response) {
      console.error('Network error — server সংযোগ করা যাচ্ছে না:', err.message);
    }
    return Promise.reject(err);
  }
);

export default api;
