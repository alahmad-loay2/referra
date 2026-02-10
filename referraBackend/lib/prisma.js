import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { PRISMA_LOG_QUERIES, NODE_ENV } from "../config/env.js";

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

  // Create a PostgreSQL connection pool (works well with Railway Postgres)
  const pool = new Pool({
    connectionString,
    max: 10, // reasonable default for a small app
    min: 0,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const adapter = new PrismaPg(pool);

  // Prisma Optimize / performance visibility: enable query logging in dev
  prisma = new PrismaClient({
    adapter,
    log:
      NODE_ENV === "development"
        ? [
            { level: "query", emit: "event" }, // needed for Prisma Optimize & manual analysis
            "error",
            "warn",
          ]
        : ["error"],
  });
}

// Optional: only dump queries when explicitly enabled to avoid noisy logs in dev
if (PRISMA_LOG_QUERIES === "true" && prisma && typeof prisma.$on === "function") {
  prisma.$on("query", (e) => {
    // This is the data Prisma Optimize (CLI / cloud) uses under the hood
    console.log(
      `[Prisma Query] duration=${e.duration}ms`,
      "\nSQL:",
      e.query,
      "\nParams:",
      e.params,
    );
  });
}

export { prisma };