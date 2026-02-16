import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { PRISMA_LOG_QUERIES, NODE_ENV } from "../config/env.js";

// Detect when we are running under tests (set via npm script)
// Unit tests use NODE_ENV=test (mocked Prisma)
// Integration tests use NODE_ENV=integration (real Prisma)
const isTestRun = process.env.NODE_ENV === "test";
const isIntegrationTest = process.env.NODE_ENV === "integration";

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
} else if (isIntegrationTest) {
  // Integration tests: Use globalThis to share the same Prisma instance across test files
  // This prevents connection pool exhaustion when tests run in parallel
  const globalForPrisma = globalThis;
  const existingPrisma = globalForPrisma.prisma;

  if (existingPrisma) {
    prisma = existingPrisma;
  } else {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set for integration tests");
    }

    const pool = new Pool({
      connectionString,
      max: 1, // Single connection for integration tests to avoid exhausting DB pool
      min: 0,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    const adapter = new PrismaPg(pool);

    prisma = new PrismaClient({
      adapter,
      log: ["error", "warn"],
    });

    globalForPrisma.prisma = prisma;
    globalForPrisma.pgPool = pool;
  }
} else {
  // Production/Development: Create a new PrismaClient instance
  // On Render, this is a long-running process, so no need for globalThis caching
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 10 : 10,
    min: 0,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const adapter = new PrismaPg(pool);

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