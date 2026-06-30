"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { searchJobs, getJobById } from "@/lib/jobs/queries";
import type { JobSearchFilters } from "@/lib/jobs/types";
import type { ActionResult } from "@/types";
import type { ApplicationStatus } from "@prisma/client";

export async function searchJobsAction(filters: JobSearchFilters) {
  return searchJobs(filters);
}

export async function getJobDetailAction(jobId: string) {
  return getJobById(jobId);
}

export async function saveJobAction(jobId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const job = await db.jobPosting.findUnique({ where: { id: jobId } });
  if (!job) return { success: false, error: "Job not found" };

  await db.jobApplication.upsert({
    where: {
      userId_jobId: { userId: session.user.id, jobId },
    },
    create: {
      userId: session.user.id,
      jobId,
      status: "SAVED",
    },
    update: {},
  });

  revalidatePath("/dashboard/applications");
  return { success: true, data: undefined };
}

export async function updateApplicationStatusAction(
  applicationId: string,
  status: ApplicationStatus,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const application = await db.jobApplication.findFirst({
    where: { id: applicationId, userId: session.user.id },
  });

  if (!application) {
    return { success: false, error: "Application not found" };
  }

  await db.jobApplication.update({
    where: { id: applicationId },
    data: {
      status,
      appliedAt: status === "APPLIED" ? new Date() : application.appliedAt,
    },
  });

  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function removeApplicationAction(
  applicationId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  await db.jobApplication.deleteMany({
    where: { id: applicationId, userId: session.user.id },
  });

  revalidatePath("/dashboard/applications");
  return { success: true, data: undefined };
}

export async function triggerIngestionAction(): Promise<
  ActionResult<{ fetched: number; created: number }>
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const { runIngestionPipeline } = await import(
    "@/lib/jobs/pipeline/ingestion-pipeline"
  );

  try {
    const result = await runIngestionPipeline();
    revalidatePath("/dashboard/jobs");
    return {
      success: true,
      data: { fetched: result.fetched, created: result.created },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion failed";
    return { success: false, error: message };
  }
}
