import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Request failed';
    const err = new Error(message);
    err.status = status;
    err.details = error.response?.data?.details;
    if (status === 401 && !window.location.pathname.startsWith('/login')) {
      const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }
    return Promise.reject(err);
  }
);

export default api;
