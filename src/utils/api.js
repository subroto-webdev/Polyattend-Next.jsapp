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

// ── FIX (Requirement #2 — "Admin can't download reports") ─────────────────
// Every report-download button used `responseType: 'blob'`. When the backend
// responded with an error (400/403/500 with a JSON body explaining why —
// e.g. "এই subject-এর Department খুঁজে পাওয়া যায়নি"), axios still returns
// that error body as a Blob (because responseType applies to error responses
// too), so `err.response?.data?.message` was always undefined and every
// failure showed the same generic "Download failed" toast. That hid the
// actual reason from the admin, making real problems look like a mysterious,
// unfixable "downloads don't work". This helper reads the blob back out as
// text and parses the real message so it can be shown to the user.
export async function getBlobErrorMessage(err, fallback = 'Download failed') {
  try {
    const data = err?.response?.data;
    if (data instanceof Blob) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed?.message || fallback;
    }
    return err?.response?.data?.message || fallback;
  } catch {
    return fallback;
  }
}
