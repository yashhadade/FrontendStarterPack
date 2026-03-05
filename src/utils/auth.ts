import { getStorageItem } from "@/utils/storageUtils";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
}

export const isAuthenticated = () => {
  const token = getStorageItem("access");

  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime; // token still valid
  } catch {
    return false;
  }
};
