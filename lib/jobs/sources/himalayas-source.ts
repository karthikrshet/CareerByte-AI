import type { JobSource } from "@prisma/client";
import { BaseJobSource } from "@/lib/jobs/sources/base-source";
import type { RawJobListing } from "@/lib/jobs/types";

interface HimalayasJob {
  id: number;
  title: string;
  companyName: string;
  companyLogo: string;
  description: string;
  applicationLink: string;
  locationRestrictions: string[];
  categories: string[];
  employmentType: string;
  minSalary?: number;
  maxSalary?: number;
  currency: string;
  pubDate: string;
}

interface HimalayasResponse {
  jobs: HimalayasJob[];
}

export class HimalayasSource extends BaseJobSource {
  readonly source: JobSource = "HIMALAYAS";
  readonly name = "Himalayas";

  isEnabled(): boolean {
    return process.env.JOB_SOURCE_HIMALAYAS_ENABLED !== "false";
  }

  async fetchJobs(): Promise<RawJobListing[]> {
    const data = await this.fetchJson<HimalayasResponse>(
      "https://himalayas.app/jobs/api",
    );

    return (data.jobs ?? []).map((job) => ({
      source: this.source,
      externalId: String(job.id),
      sourceUrl: job.applicationLink,
      title: job.title,
      companyName: job.companyName,
      companyLogoUrl: job.companyLogo,
      description: job.description,
      applyUrl: job.applicationLink,
      location: job.locationRestrictions?.join(", ") || "Remote",
      remotePolicy: "REMOTE",
      employmentType: mapEmploymentType(job.employmentType),
      salaryMin: job.minSalary,
      salaryMax: job.maxSalary,
      salaryCurrency: job.currency || "USD",
      salaryPeriod: "yearly",
      tags: job.categories ?? [],
      postedAt: job.pubDate ? new Date(job.pubDate) : undefined,
      rawPayload: job,
    }));
  }
}

function mapEmploymentType(
  value: string,
): RawJobListing["employmentType"] {
  const lower = value?.toLowerCase() ?? "";
  if (lower.includes("full")) return "FULL_TIME";
  if (lower.includes("part")) return "PART_TIME";
  if (lower.includes("contract")) return "CONTRACT";
  if (lower.includes("intern")) return "INTERNSHIP";
  return "UNKNOWN";
}
