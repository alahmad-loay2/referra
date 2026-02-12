// importing all the environment variables file

import { config } from "dotenv";

// In production: load from plain `.env`
// In development/other envs: load from `.env.development.local`
if (process.env.NODE_ENV === "production") {
  config({ path: ".env" });
} else {
  config({ path: ".env.development.local" });
}

export const {
  PORT,
  NODE_ENV,
  FRONTEND_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  RESEND_API_KEY,
  PRISMA_LOG_QUERIES,
} = process.env;
