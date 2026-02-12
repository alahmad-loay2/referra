import app from "./app.js";
import { PORT } from "./config/env.js";
import { startCloseExpiredPositionsJob } from "./jobs/closeExpiredPosition.job.js";
import { startIdempotencyCleanupJob } from "./jobs/cleanupIdempotencyKeys.job.js";

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server is running on port ${PORT}`);
  // Start background jobs
  startCloseExpiredPositionsJob();
  startIdempotencyCleanupJob();
});
