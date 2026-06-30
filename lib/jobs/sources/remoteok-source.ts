import type { JobSource } from "@prisma/client";
import { BaseJobSource } from "@/lib/jobs/sources/base-source";
import type { RawJobListing } from "@/lib/jobs/types";

interface RemoteOkJob {
  id: string;
  slug: string;
  company: string;
  company_logo?: string;
  position: string;
  description: string;
  location: string;
  url: string;
  apply_url: string;
  tags?: string[];
  salary_min?: number;
  salary_max?: number;
  date: string;
}

export class RemoteOkSource extends BaseJobSource {
  readonly source: JobSource = "REMOTEOK";
  readonly name = "RemoteOK";

  isEnabled(): boolean {
    return process.env.JOB_SOURCE_REMOTEOK_ENABLED !== "false";
  }

  async fetchJobs(): Promise<RawJobListing[]> {
    const data = await this.fetchJson<RemoteOkJob[]>(
      "https://remoteok.com/api",
      { headers: { Accept: "application/json" } },
    );

    return data
      .filter((item): item is RemoteOkJob => Boolean(item?.id && item?.position))
      .map((job) => ({
        source: this.source,
        externalId: String(job.id),
        sourceUrl: job.url,
        title: job.position,
        companyName: job.company,
        companyLogoUrl: job.company_logo,
        description: job.description,
        applyUrl: job.apply_url || job.url,
        location: job.location || "Remote",
        remotePolicy: "REMOTE",
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        salaryCurrency: "USD",
        salaryPeriod: "yearly",
        tags: job.tags ?? [],
        postedAt: job.date ? new Date(job.date) : undefined,
        rawPayload: job,
      }));
  }
}
