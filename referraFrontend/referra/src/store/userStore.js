import { create } from "zustand";
// create a global object called userStore create creates a global store and returns a react hook
export const useUserStore = create((set) => ({
  firstName: null,
  setFirstName: (name) => set({ firstName: name }), // state updater function
}));
