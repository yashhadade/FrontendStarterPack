import { getStorageItem } from '@/utils/storageUtils';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;
}

export const isAuthenticated = () => {
  const accessToken = getStorageItem('access');
  const refreshToken = getStorageItem('refresh');

  // If access token is missing/expired but we still have a refresh token,
  // allow navigation; axios will refresh transparently on `401`.
  if (!accessToken) return !!refreshToken;

  try {
    const decoded = jwtDecode<DecodedToken>(accessToken);
    const currentTime = Date.now() / 1000;

    if (decoded.exp > currentTime) return true; // access token still valid
    return !!refreshToken; // access token expired; rely on refresh
  } catch {
    // If access token can't be decoded, fall back to refresh token presence.
    return !!refreshToken;
  }
};
