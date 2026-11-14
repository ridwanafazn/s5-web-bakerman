import axios from 'axios';

import { auth } from '../authentication/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Biarkan request berjalan tanpa token; server akan membalas 401.
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const method = (config.method || 'get').toLowerCase();
    const status = error.response?.status;
    const canRetry =
      (method === 'get' || method === 'head') &&
      (!error.response || status === 503) &&
      !config.__retried;

    if (canRetry) {
      config.__retried = true;
      await new Promise((resolve) => setTimeout(resolve, 900));
      return api(config);
    }

    const message =
      error.response?.data?.error || error.message || 'Request gagal';
    error.friendlyMessage = message;
    return Promise.reject(error);
  }
);

export default api;
