import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";

// Initialize Prisma Client with PostgreSQL adapter (from prisma docs)

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create connection pool with optimized settings for fast first connections
const pool = new Pool({
  connectionString,
  max: 30, // Increased max connections for better concurrency
  min: 5, // Keep more connections warm for faster response times
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Pre-warm connections
  allowExitOnIdle: false, // Keep pool alive
  // Statement timeout to prevent long-running queries
  statement_timeout: 5000, // 5 seconds max per query
});

// Warm up the connection pool on startup (for faster first calls)
pool.on("connect", () => {
  // Connection established
});

// Initialize pool immediately
pool.query("SELECT 1").catch(() => {
  // Ignore errors during warmup, pool will connect on first real query
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

export { prisma };
