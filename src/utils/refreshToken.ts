import axios from 'axios';
import { getStorageItem, setStorageItem } from '@/utils/storageUtils';

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getStorageItem('refresh');
  if (!refreshToken) throw new Error('Missing refresh token');

  const baseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5003/';
  const refreshEndpoint = import.meta.env.VITE_REFRESH_ENDPOINT || 'auth/refresh';

  // Use a bare axios client so we don't trigger the same interceptors again.
  const refreshClient = axios.create({
    baseURL,
    responseType: 'json',
    headers: {},
  });

  const res = await refreshClient.post(refreshEndpoint, { refreshToken });
  const rawAccessToken = res?.data?.data?.accessToken ?? null;
  const newAccessToken = rawAccessToken ? String(rawAccessToken) : null;

  if (!newAccessToken) {
    throw new Error('Refresh did not return an access token');
  }

  setStorageItem('access', newAccessToken);

  const rawRefreshToken = res?.data?.data?.refreshToken ?? null;
  if (rawRefreshToken) setStorageItem('refresh', String(rawRefreshToken));

  return newAccessToken;
}
