import { create } from 'zustand'

export const useUserStore = create((set) => ({
  firstName: null,
  setFirstName: (name) => set({ firstName: name }),
  isAdmin: false,
  setIsAdmin: (admin) => set({ isAdmin: admin }),
  reset: () => set({ firstName: null, isAdmin: false }),
}))
