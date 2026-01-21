import { config } from "dotenv";

// Only load .env files in development, in production (Vercel) use process.env directly
if (process.env.NODE_ENV !== 'production') {
  config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });
}

export const {
  PORT,
  NODE_ENV,
  FRONTEND_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} = process.env;
