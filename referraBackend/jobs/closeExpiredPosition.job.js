import cron from "node-cron";
import { prisma } from "../lib/prisma.js";

export const startCloseExpiredPositionsJob = () => {
  // Run every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();

      const result = await prisma.position.updateMany({
        where: {
          PositionState: "OPEN",
          Deadline: {
            lt: now,
          },
        },
        data: {
          PositionState: "CLOSED",
        },
      });

      if (result.count > 0) {
        console.log(` Auto-closed ${result.count} expired positions`);
      }
    } catch (error) {
      console.error(" Error auto-closing expired positions:", error);
    }
  });
};
