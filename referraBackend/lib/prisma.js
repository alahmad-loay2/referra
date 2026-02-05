import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";

// Detect when we are running under tests (set via npm script)
const isTestRun = process.env.NODE_ENV === "test";

let prisma;

if (isTestRun) {
  // Lightweight mock-like client for unit tests so we don't keep DB handles open
  prisma = {
    users: {},
    hr: {},
    department: {},
    position: {},
    application: {},
    hrDepartment: {},
    referral: {},
    candidate: {},
    compensation: {},
    employee: {},
    $disconnect: async () => {},
  };
} else {
  // Initialize Prisma Client with PostgreSQL adapter (from prisma docs)
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Create connection pool with optimized settings for fast first connections
  const pool = new Pool({
    connectionString,
    max: 30,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    allowExitOnIdle: false,
    statement_timeout: 5000,
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
  prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export { prisma };
