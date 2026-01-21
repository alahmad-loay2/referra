import { config } from "dotenv";

// Only load .env files in development, Vercel provides env vars directly
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  try {
    config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });
  } catch (error) {
    // Ignore if .env file doesn't exist
  }
}

export const {
  PORT = 3000,
  NODE_ENV,
  FRONTEND_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} = process.env;
