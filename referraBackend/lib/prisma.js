import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { PRISMA_LOG_QUERIES, NODE_ENV } from "../config/env.js";

// Detect when we are running under tests (set via npm script)
const isTestRun = process.env.NODE_ENV === "test";

// In serverless / hot-reload environments (Vercel, dev with nodemon),
// reuse a single PrismaClient + Pool via globalThis to avoid spawning
// many DB connections. Point DATABASE_URL at PgBouncer so that *this*
// single pool talks to PgBouncer, which then fans out to Postgres.
const globalForPrisma = globalThis;

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
  const existingPrisma = globalForPrisma.prisma;

  if (existingPrisma) {
    // Reuse already-initialized PrismaClient (and its underlying pool)
    prisma = existingPrisma;
  } else {
    // Initialize Prisma Client with PostgreSQL adapter (from prisma docs)
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Create a PostgreSQL connection pool (kept small; PgBouncer should handle fan-out)
    const existingPool = globalForPrisma.pgPool;
    const pool =
      existingPool ||
      new Pool({
        connectionString,
        max: process.env.NODE_ENV === "production" ? 1 : 10,
        min: 0,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

    if (!existingPool) {
      globalForPrisma.pgPool = pool;
    }

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

    // Cache PrismaClient on globalThis so it's reused across hot reloads
    globalForPrisma.prisma = prisma;
  }
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