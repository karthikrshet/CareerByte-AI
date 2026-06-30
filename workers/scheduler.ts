import cron from "node-cron";
import { DEFAULT_INGESTION_CRON } from "@/lib/jobs/constants";
import { runIngestionPipeline } from "@/lib/jobs/pipeline/ingestion-pipeline";

let isRunning = false;

export async function executeIngestionJob(): Promise<void> {
  if (isRunning) {
    console.log("[Worker] Ingestion already running, skipping...");
    return;
  }

  isRunning = true;
  const start = Date.now();

  try {
    console.log("[Worker] Starting scheduled job ingestion...");
    const result = await runIngestionPipeline();
    console.log(
      `[Worker] Ingestion complete in ${Date.now() - start}ms:`,
      `fetched=${result.fetched} created=${result.created} updated=${result.updated} skipped=${result.skipped}`,
    );
    if (result.errors.length > 0) {
      console.warn("[Worker] Errors:", result.errors.slice(0, 5));
    }
  } catch (error) {
    console.error("[Worker] Ingestion failed:", error);
  } finally {
    isRunning = false;
  }
}

export function startIngestionScheduler(): void {
  const schedule =
    process.env.JOB_INGESTION_CRON ?? DEFAULT_INGESTION_CRON;

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid JOB_INGESTION_CRON: ${schedule}`);
  }

  console.log(`[Worker] Scheduling ingestion: "${schedule}"`);

  cron.schedule(schedule, () => {
    void executeIngestionJob();
  });
}
