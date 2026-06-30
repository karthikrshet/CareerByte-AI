import type { JobSource } from "@prisma/client";
import db from "@/lib/db";
import { generateJobFingerprint } from "@/lib/jobs/dedup/fingerprint";
import type { RawJobListing } from "@/lib/jobs/types";

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingJobId?: string;
  fingerprint: string;
  reason?: "fingerprint" | "source_record";
}

export async function checkDuplicate(
  listing: RawJobListing,
): Promise<DeduplicationResult> {
  const fingerprint = generateJobFingerprint(
    listing.title,
    listing.companyName,
    listing.location,
  );

  const [byFingerprint, bySource] = await Promise.all([
    db.jobPosting.findUnique({
      where: { fingerprint },
      select: { id: true },
    }),
    db.jobSourceRecord.findUnique({
      where: {
        source_externalId: {
          source: listing.source,
          externalId: listing.externalId,
        },
      },
      select: { jobId: true },
    }),
  ]);

  if (bySource) {
    return {
      isDuplicate: true,
      existingJobId: bySource.jobId,
      fingerprint,
      reason: "source_record",
    };
  }

  if (byFingerprint) {
    return {
      isDuplicate: true,
      existingJobId: byFingerprint.id,
      fingerprint,
      reason: "fingerprint",
    };
  }

  return { isDuplicate: false, fingerprint };
}

export async function findExistingBySource(
  source: JobSource,
  externalId: string,
) {
  return db.jobSourceRecord.findUnique({
    where: { source_externalId: { source, externalId } },
    include: { job: true },
  });
}
