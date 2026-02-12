import { useUserStore } from '../store/userStore.js';

/**
 * Clears the Zustand user store when authentication fails or user is logged out
 * This should be called when:
 * - User gets 401/403 response
 * - Token expires
 * - Automatic logout occurs
 */
export const clearUserStoreOnAuthFailure = () => {
  const reset = useUserStore.getState().reset;
  reset();
};
