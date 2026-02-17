import cron from "node-cron";
import { cleanupExpiredIdempotencyKeys } from "../middleware/idempotency.middleware.js";

export const startIdempotencyCleanupJob = () => {
  // Run once a day at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    try {
      const removedCount = await cleanupExpiredIdempotencyKeys();

      if (removedCount > 0) {
        console.log(` Cleaned up ${removedCount} expired idempotency keys`);
      }
    } catch (error) {
      console.error(" Error cleaning up expired idempotency keys:", error);
    }
  });
};
