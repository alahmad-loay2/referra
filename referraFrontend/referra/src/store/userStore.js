import { create } from 'zustand'

export const useUserStore = create((set) => ({
  firstName: null,
  setFirstName: (name) => set({ firstName: name }),
}))
