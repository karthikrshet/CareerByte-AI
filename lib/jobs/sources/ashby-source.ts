import type { JobSource } from "@prisma/client";
import { getAshbyBoards } from "@/config/job-sources";
import { BaseJobSource } from "@/lib/jobs/sources/base-source";
import type { RawJobListing } from "@/lib/jobs/types";

interface AshbyJob {
  id: string;
  title: string;
  department: string;
  team: string;
  employmentType: string;
  location: string;
  isRemote: boolean | null;
  publishedAt: string;
  descriptionHtml: string;
  descriptionPlain: string;
  jobUrl: string;
  applyUrl: string;
  compensation?: {
    compensationTierSummary?: string;
    scrapeableCompensationSalarySummary?: string;
  };
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

export class AshbySource extends BaseJobSource {
  readonly source: JobSource = "ASHBY";
  readonly name = "Ashby";

  isEnabled(): boolean {
    return (
      process.env.JOB_SOURCE_ASHBY_ENABLED !== "false" &&
      getAshbyBoards().length > 0
    );
  }

  async fetchJobs(): Promise<RawJobListing[]> {
    const boards = getAshbyBoards();
    const listings: RawJobListing[] = [];

    for (const board of boards) {
      try {
        const data = await this.fetchJson<AshbyResponse>(
          `https://api.ashbyhq.com/posting-api/job-board/${board}`,
        );

        for (const job of data.jobs ?? []) {
          listings.push({
            source: this.source,
            externalId: `${board}:${job.id}`,
            sourceUrl: job.jobUrl,
            title: job.title,
            companyName: board.charAt(0).toUpperCase() + board.slice(1),
            description: job.descriptionPlain || job.title,
            descriptionHtml: job.descriptionHtml,
            applyUrl: job.applyUrl || job.jobUrl,
            location: job.location,
            remotePolicy: job.isRemote ? "REMOTE" : undefined,
            salaryRaw:
              job.compensation?.scrapeableCompensationSalarySummary ??
              job.compensation?.compensationTierSummary,
            tags: [job.department, job.team, job.employmentType].filter(
              Boolean,
            ),
            postedAt: job.publishedAt ? new Date(job.publishedAt) : undefined,
            rawPayload: { board, job },
          });
        }
      } catch (error) {
        console.error(`[Ashby] Board "${board}" failed:`, error);
      }
    }

    return listings;
  }
}
