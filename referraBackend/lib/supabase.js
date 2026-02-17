import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config/env.js";

// In tests we don't need a real Supabase client; avoid throwing if env isn't set
const isTestRun = process.env.NODE_ENV === "test";
const isIntegrationTest = process.env.NODE_ENV === "integration";

let supabase;

if (isTestRun || isIntegrationTest) {
  supabase = {
    storage: {
      from: () => ({
        // Default no-op mocks; individual tests can override as needed
        upload: async () => ({
          data: { path: `test-cv-${Date.now()}.pdf` },
          error: null,
        }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
    auth: {
      refreshSession: async () => ({ data: null, error: null }),
      // no-op mocks used in tests; real behavior is covered in integration/e2e
      signUp: async () => ({ data: null, error: null }),
      resend: async () => ({ data: null, error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
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
