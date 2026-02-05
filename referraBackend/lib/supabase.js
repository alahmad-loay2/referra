import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config/env.js";

// In tests we don't need a real Supabase client; avoid throwing if env isn't set
const isTestRun = process.env.NODE_ENV === "test";

let supabase;

if (isTestRun) {
  supabase = {
    storage: {
      from: () => ({
        // Default no-op mocks; individual tests can override as needed
        upload: async () => ({ data: null, error: null }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
  };
} else {
  // Initialize Supabase client for non-test environments
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and Anon Key must be configured");
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export { supabase };
