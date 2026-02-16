import { create } from "zustand";
// create a global object called userStore create creates a global store and returns a react hook
export const useUserStore = create((set) => ({
  firstName: null,
  setFirstName: (name) => set({ firstName: name }),
  isAdmin: false,
  setIsAdmin: (admin) => set({ isAdmin: admin }),
  isHr: false,
  setIsHr: (isHr) => set({ isHr: isHr }),
  // View mode for HR users: "hr" or "employee"
  viewMode: "hr", // default to "hr" for HR users
  setViewMode: (mode) => set({ viewMode: mode }),
  reset: () => set({ firstName: null, isAdmin: false, isHr: false, viewMode: "hr" }),
}))
