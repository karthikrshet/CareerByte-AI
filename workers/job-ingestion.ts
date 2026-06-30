/**
 * Job Ingestion Worker
 *
 * Standalone process that runs scheduled job discovery from external APIs.
 *
 * Usage:
 *   npm run worker:jobs          # start cron scheduler
 *   npm run worker:jobs:once     # run ingestion once and exit
 */

import { startIngestionScheduler, executeIngestionJob } from "./scheduler";

async function main() {
  const runOnce = process.argv.includes("--once");

  console.log("=".repeat(50));
  console.log("JobPilot AI — Job Ingestion Worker");
  console.log("=".repeat(50));

  if (runOnce) {
    await executeIngestionJob();
    process.exit(0);
  }

  // Run immediately on startup, then schedule
  await executeIngestionJob();
  startIngestionScheduler();

  console.log("[Worker] Scheduler running. Press Ctrl+C to stop.");

  process.on("SIGINT", () => {
    console.log("\n[Worker] Shutting down...");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n[Worker] Received SIGTERM, shutting down...");
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("[Worker] Fatal error:", error);
  process.exit(1);
});
