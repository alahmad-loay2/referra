import cron from "node-cron";
import { PORT } from "../config/env.js";

// Ping health endpoint to keep Render service awake
const pingHealthEndpoint = async () => {
  try {
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    const response = await fetch(`${baseUrl}/api/health`);
    if (response.ok) {
      console.log(" Health check ping successful");
    }
  } catch (error) {
    // Silently fail - this is just a keep-alive ping
    console.log(" Health check ping failed (non-critical):", error.message);
  }
};

export const startHealthCheckJob = () => {
  // Run every 5 minutes to keep Render service awake
  cron.schedule("*/5 * * * *", async () => {
    await pingHealthEndpoint();
  });
};
