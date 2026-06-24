import axios from 'axios';
import i18n from '../i18n/index.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

function currentLang() {
  return i18n.language?.startsWith('ar') ? 'ar' : 'en';
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fresco_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const lang = currentLang();
  config.headers['X-Language'] = lang;
  config.headers['Accept-Language'] =
    lang === 'ar' ? 'ar-EG,ar;q=0.9,en;q=0.8' : 'en-US,en;q=0.9,ar;q=0.8';
  const p = config.params;
  if (p === undefined || p === null) {
    config.params = { lang };
  } else if (typeof p === 'object' && !Array.isArray(p) && p.lang === undefined) {
    config.params = { ...p, lang };
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (
      import.meta.env.DEV &&
      typeof res.config?.url === 'string' &&
      res.config.url.includes('menu') &&
      Array.isArray(res.data?.data) &&
      res.data.data[0]
    ) {
      const first = res.data.data[0];
      console.debug('[i18n] menu response sample', { lang: currentLang(), name: first.name });
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fresco_token');
      const path = window.location.pathname || '';
      if (!path.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
