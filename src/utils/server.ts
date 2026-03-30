import { authHeader } from '@/helpers/authHeader';
import axios, { type AxiosError, type AxiosRequestConfig, type AxiosRequestHeaders } from 'axios';
import { getStorageItem, removeStorageItem } from '@/utils/storageUtils';
import { refreshAccessToken } from '@/utils/refreshToken';

const baseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5003/';

export const server = axios.create({
  baseURL,
  responseType: 'json',
  headers: {},
});

server.interceptors.request.use(
  (config) => {
    const token = authHeader();
    config.headers = (config.headers ?? {}) as AxiosRequestHeaders;
    config.headers.Authorization = token;
    return config;
  },
  null,
  { synchronous: true }
);

type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

const shouldSkipRefresh = (request?: RetryConfig) => {
  const url = request?.url ?? '';
  // Never run refresh flow for auth endpoints (login/refresh/logout/etc).
  return url.includes('/auth/') || url.startsWith('auth/');
};

server.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetryConfig | undefined;

    if (!originalRequest) return Promise.reject(error);

    // Only attempt refresh once per request, for non-auth routes,
    // and only when we actually have a refresh token.
    if (
      status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest) &&
      !!getStorageItem('refresh')
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newAccessToken = await refreshPromise;

        // Retry original request; request interceptor will attach the new token.
        originalRequest.headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
        originalRequest.headers.Authorization = newAccessToken;
        return server(originalRequest);
      } catch (refreshErr) {
        removeStorageItem();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
