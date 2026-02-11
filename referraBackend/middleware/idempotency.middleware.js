import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

// Idempotency key expiration: 24 hours
const IDEMPOTENCY_KEY_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Middleware to handle idempotency for POST requests
 * Checks for Idempotency-Key header and returns cached response if key was already used
 */
export const idempotencyMiddleware = async (req, res, next) => {
  // Only apply to POST requests
  if (req.method !== "POST") {
    return next();
  }

  const idempotencyKey = req.headers["idempotency-key"] || req.headers["x-idempotency-key"];

  // If no idempotency key provided, proceed normally
  if (!idempotencyKey) {
    return next();
  }

  // Validate key format (should be a non-empty string)
  if (typeof idempotencyKey !== "string" || idempotencyKey.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid idempotency key. Must be a non-empty string.",
    });
  }

  // Get user ID if authenticated (null for public routes)
  // This allows different users to use the same idempotency key safely
  // The composite unique constraint @@unique([Key, UserId]) ensures keys are scoped per user
  const userId = req.user?.UserId || null;

  // Create a unique key combining idempotency key, method, and path
  const method = req.method;
  const path = req.path;
  
  // Create a hash of the request body for additional validation (optional)
  const requestBody = req.body ? JSON.stringify(req.body) : "";
  const requestHash = crypto.createHash("sha256").update(requestBody).digest("hex");

  try {
    // Check if this idempotency key already exists for this user
    // For unauthenticated users (userId is null), this still works with the composite unique constraint
    const existingKey = await prisma.idempotencyKey.findUnique({
      where: {
        Key_UserId: {
          Key: idempotencyKey,
          UserId: userId,
        },
      },
    });

    // If key exists and hasn't expired
    if (existingKey && new Date(existingKey.ExpiresAt) > new Date()) {
      // Verify it's for the same endpoint
      if (existingKey.Method === method && existingKey.Path === path) {
        // Optional: verify request hash matches (for extra safety)
        if (existingKey.RequestHash && existingKey.RequestHash !== requestHash) {
          return res.status(409).json({
            success: false,
            message: "Idempotency key conflict: same key used with different request body.",
          });
        }

        // Return cached response
        return res.status(existingKey.ResponseStatus).json(existingKey.ResponseBody);
      } else {
        // Same key used for different endpoint
        return res.status(409).json({
          success: false,
          message: "Idempotency key conflict: same key used for different endpoint.",
        });
      }
    }

    // Key doesn't exist or has expired - proceed with request
    // Store original json method to restore later
    const originalJson = res.json.bind(res);

    // Override res.json to capture the response
    res.json = function (body) {
      // Store the response in database (async, don't block response)
      storeIdempotencyResponse(
        idempotencyKey,
        userId,
        method,
        path,
        requestHash,
        res.statusCode,
        body,
      ).catch((err) => {
        // Log error but don't fail the request
        console.error("Failed to store idempotency response:", err);
      });

      // Send the response
      return originalJson(body);
    };

    next();
  } catch (error) {
    // If there's an error checking idempotency, log it but proceed with request
    console.error("Idempotency middleware error:", error);
    next();
  }
};

/**
 * Store idempotency key and response in database
 */
async function storeIdempotencyResponse(
  key,
  userId,
  method,
  path,
  requestHash,
  statusCode,
  responseBody,
) {
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_KEY_TTL);

  try {
    await prisma.idempotencyKey.create({
      data: {
        Key: key,
        UserId: userId, // null for unauthenticated users, actual UserId for authenticated
        Method: method,
        Path: path,
        RequestHash: requestHash,
        ResponseStatus: statusCode,
        ResponseBody: responseBody,
        ExpiresAt: expiresAt,
      },
    });
  } catch (error) {
    // If key already exists (race condition), that's okay - it means another request
    // with the same key completed first, which is expected behavior
    if (error.code === "P2002") {
      // Unique constraint violation - key already exists for this user
      // This can happen in race conditions, which is fine
      return;
    }
    throw error;
  }
}

/**
 * Cleanup expired idempotency keys (can be run as a scheduled job)
 */
export async function cleanupExpiredIdempotencyKeys() {
  try {
    const result = await prisma.idempotencyKey.deleteMany({
      where: {
        ExpiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error("Error cleaning up expired idempotency keys:", error);
    throw error;
  }
}
