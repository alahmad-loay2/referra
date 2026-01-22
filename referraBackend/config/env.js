import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

export const {
  PORT,
  NODE_ENV,
  FRONTEND_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  RESEND_API_KEY,
} = process.env;
