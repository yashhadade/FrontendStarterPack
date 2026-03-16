import { create } from "zustand";

interface DltAddressStore {
    dltAddress: string;
    setDltAddress: (dltAddress: string) => void;
    clearDltAddress: () => void;
}

export const useDltAddressStore = create<DltAddressStore>((set) => ({
    dltAddress: "",
    setDltAddress: (dltAddress: string) => set({ dltAddress }),
    clearDltAddress: () => set({ dltAddress: "" }),
}))