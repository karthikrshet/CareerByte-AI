import type { JobSource, Prisma } from "@prisma/client";
import db from "@/lib/db";
import { checkDuplicate } from "@/lib/jobs/dedup/deduplicator";
import { enrichListingWithSalary } from "@/lib/jobs/extractors/salary-extractor";
import { extractJobSkills } from "@/lib/jobs/extractors/skill-extractor";
import { upsertCompany } from "@/lib/jobs/normalizers/company-normalizer";
import { normalizeJobListing } from "@/lib/jobs/normalizers/job-normalizer";
import {
  getEnabledJobSources,
  getJobSourceByType,
} from "@/lib/jobs/registry";
import type {
  IngestionResult,
  IngestionStats,
  JobSourceAdapter,
  RawJobListing,
} from "@/lib/jobs/types";

async function persistListing(
  listing: RawJobListing,
  fingerprint: string,
  existingJobId?: string,
): Promise<"created" | "updated" | "skipped"> {
  const enriched = enrichListingWithSalary(listing);
  const company = await upsertCompany({
    name: enriched.companyName,
    website: enriched.companyWebsite,
    logoUrl: enriched.companyLogoUrl,
  });

  const normalized = normalizeJobListing(enriched, company.slug);
  const skills = extractJobSkills(
    normalized.title,
    normalized.description,
    enriched.tags ?? [],
  );

  if (existingJobId) {
    const existing = await db.jobPosting.findUnique({
      where: { id: existingJobId },
      include: { sources: true },
    });

    const hasSource = existing?.sources.some(
      (s) =>
        s.source === listing.source &&
        s.externalId === listing.externalId,
    );

    if (hasSource) {
      await db.$transaction(async (tx) => {
        await tx.jobPosting.update({
          where: { id: existingJobId },
          data: {
            title: normalized.title,
            description: normalized.description,
            descriptionHtml: normalized.descriptionHtml,
            applyUrl: normalized.applyUrl,
            location: normalized.location,
            remotePolicy: normalized.remotePolicy,
            employmentType: normalized.employmentType,
            salaryMin: normalized.salaryMin,
            salaryMax: normalized.salaryMax,
            salaryCurrency: normalized.salaryCurrency,
            salaryPeriod: normalized.salaryPeriod,
            salaryRaw: normalized.salaryRaw,
            postedAt: normalized.postedAt,
            isActive: true,
          },
        });

        await tx.jobSkill.deleteMany({ where: { jobId: existingJobId } });
        if (skills.length > 0) {
          await tx.jobSkill.createMany({
            data: skills.map((s) => ({ ...s, jobId: existingJobId })),
          });
        }
      });
      return "updated";
    }

    await db.jobSourceRecord.create({
      data: {
        jobId: existingJobId,
        source: listing.source,
        externalId: listing.externalId,
        sourceUrl: listing.sourceUrl,
        rawPayload: listing.rawPayload as Prisma.InputJsonValue,
      },
    });
    return "updated";
  }

  let slug = normalized.slug;
  let suffix = 1;
  while (await db.jobPosting.findFirst({ where: { slug } })) {
    slug = `${normalized.slug}-${suffix++}`;
  }

  await db.$transaction(async (tx) => {
    const job = await tx.jobPosting.create({
      data: {
        companyId: company.id,
        title: normalized.title,
        slug,
        description: normalized.description,
        descriptionHtml: normalized.descriptionHtml,
        applyUrl: normalized.applyUrl,
        location: normalized.location,
        remotePolicy: normalized.remotePolicy,
        employmentType: normalized.employmentType,
        salaryMin: normalized.salaryMin,
        salaryMax: normalized.salaryMax,
        salaryCurrency: normalized.salaryCurrency,
        salaryPeriod: normalized.salaryPeriod,
        salaryRaw: normalized.salaryRaw,
        fingerprint,
        postedAt: normalized.postedAt,
        isActive: true,
        sources: {
          create: {
            source: listing.source,
            externalId: listing.externalId,
            sourceUrl: listing.sourceUrl,
            rawPayload: listing.rawPayload as Prisma.InputJsonValue,
          },
        },
        skills: {
          create: skills.map((s) => ({
            name: s.name,
            category: s.category,
            confidence: s.confidence,
          })),
        },
      },
    });
    return job;
  });

  return "created";
}

async function ingestFromSource(
  adapter: JobSourceAdapter,
  runId: string,
): Promise<IngestionStats & { errors: string[] }> {
  const stats: IngestionStats = {
    fetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
  };
  const errors: string[] = [];

  try {
    const listings = await adapter.fetchJobs();
    stats.fetched = listings.length;

    for (const listing of listings) {
      try {
        const dedup = await checkDuplicate(listing);

        if (dedup.isDuplicate && dedup.reason === "source_record") {
          const result = await persistListing(
            listing,
            dedup.fingerprint,
            dedup.existingJobId,
          );
          if (result === "updated") stats.updated++;
          else stats.skipped++;
          continue;
        }

        if (dedup.isDuplicate) {
          await db.jobSourceRecord.create({
            data: {
              jobId: dedup.existingJobId!,
              source: listing.source,
              externalId: listing.externalId,
              sourceUrl: listing.sourceUrl,
              rawPayload: listing.rawPayload as Prisma.InputJsonValue,
            },
          });
          stats.skipped++;
          continue;
        }

        const result = await persistListing(listing, dedup.fingerprint);
        if (result === "created") stats.created++;
        else if (result === "updated") stats.updated++;
        else stats.skipped++;
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Unknown listing error";
        errors.push(`${listing.externalId}: ${msg}`);
        stats.skipped++;
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Source fetch failed";
    errors.push(msg);
    throw error;
  } finally {
    await db.ingestionRun.update({
      where: { id: runId },
      data: {
        jobsFetched: { increment: stats.fetched },
        jobsCreated: { increment: stats.created },
        jobsUpdated: { increment: stats.updated },
        jobsSkipped: { increment: stats.skipped },
      },
    });
  }

  return { ...stats, errors };
}

export async function runIngestionPipeline(
  source?: JobSource,
): Promise<IngestionResult> {
  const adapters = source
    ? [getJobSourceByType(source)].filter(Boolean)
    : getEnabledJobSources();

  if (adapters.length === 0) {
    throw new Error("No enabled job sources configured");
  }

  const run = await db.ingestionRun.create({
    data: {
      source: source ?? null,
      status: "RUNNING",
    },
  });

  const totals: IngestionStats = {
    fetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
  };
  const allErrors: string[] = [];

  try {
    for (const adapter of adapters as JobSourceAdapter[]) {
      console.log(`[Ingestion] Starting ${adapter.name}...`);
      const result = await ingestFromSource(adapter, run.id);
      totals.fetched += result.fetched;
      totals.created += result.created;
      totals.updated += result.updated;
      totals.skipped += result.skipped;
      allErrors.push(...result.errors);
      console.log(
        `[Ingestion] ${adapter.name}: fetched=${result.fetched} created=${result.created} updated=${result.updated}`,
      );
    }

    await db.ingestionRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        errorMessage: allErrors.length > 0 ? allErrors.join("\n") : null,
      },
    });

    return {
      runId: run.id,
      source: source ?? "ALL",
      ...totals,
      errors: allErrors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion failed";
    await db.ingestionRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: message,
      },
    });
    throw error;
  }
}
