import { create } from 'zustand';

interface User {
  _id: string;
  username: string;
  email: string;
  phoneNumber: string;
  kycSteps: number;
  status: string;
  isNetworkExclusive: boolean;
  isExclusive: boolean;
  isListingOnBording: boolean;
  platformDomain: string;
  platformColorCode: string;
  platformLogo: string;
  mobileNumber: string;
  panNumber: string;
  city: string;
  panCard: File | null;
  companyName: string;
  companyType: string;
  cin: string;
  companyPanNumber: string;
  gstIN: string;
  enityType: string;
  authorizedName: string;
  din: string;
  officialEmail: string;
  url: string;
  documents: { docUrl: string; docName: string }[];
  companybankAccount: string;
  ifscCode: string;
  images: { docUrl: string; docName: string }[];
  registeredOfficeAddress: string;
  communicationAddress: string;
  yearOfIncorporation: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authReady: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  updateUser: (data: Partial<User>) => void;
  setAuthReady: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  authReady: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
    }),

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),

  setAuthReady: () =>
    set({
      authReady: true,
    }),
}));

export default useAuthStore;
