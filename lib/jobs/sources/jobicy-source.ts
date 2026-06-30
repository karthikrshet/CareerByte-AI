import type { JobSource } from "@prisma/client";
import { BaseJobSource } from "@/lib/jobs/sources/base-source";
import type { RawJobListing } from "@/lib/jobs/types";

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobLevel: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;
  annualSalaryMin?: string;
  annualSalaryMax?: string;
  salaryCurrency: string;
}

interface JobicyResponse {
  jobs: JobicyJob[];
}

export class JobicySource extends BaseJobSource {
  readonly source: JobSource = "JOBICY";
  readonly name = "Jobicy";

  isEnabled(): boolean {
    return process.env.JOB_SOURCE_JOBICY_ENABLED !== "false";
  }

  async fetchJobs(): Promise<RawJobListing[]> {
    const data = await this.fetchJson<JobicyResponse>(
      "https://jobicy.com/api/v2/remote-jobs",
    );

    return (data.jobs ?? []).map((job) => ({
      source: this.source,
      externalId: String(job.id),
      sourceUrl: job.url,
      title: job.jobTitle,
      companyName: job.companyName,
      companyLogoUrl: job.companyLogo,
      description: job.jobDescription || job.jobExcerpt,
      applyUrl: job.url,
      location: job.jobGeo || "Remote",
      remotePolicy: "REMOTE",
      salaryMin: job.annualSalaryMin
        ? parseInt(job.annualSalaryMin, 10)
        : undefined,
      salaryMax: job.annualSalaryMax
        ? parseInt(job.annualSalaryMax, 10)
        : undefined,
      salaryCurrency: job.salaryCurrency || "USD",
      salaryPeriod: "yearly",
      tags: [...(job.jobIndustry ?? []), ...(job.jobType ?? []), job.jobLevel],
      postedAt: job.pubDate ? new Date(job.pubDate) : undefined,
      rawPayload: job,
    }));
  }
}
