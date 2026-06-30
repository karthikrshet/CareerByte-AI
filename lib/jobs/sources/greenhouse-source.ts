import type { JobSource } from "@prisma/client";
import { getGreenhouseBoards } from "@/config/job-sources";
import { BaseJobSource } from "@/lib/jobs/sources/base-source";
import type { RawJobListing } from "@/lib/jobs/types";
import { stripHtml } from "@/lib/jobs/normalizers/job-normalizer";

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  absolute_url: string;
  updated_at: string;
  content?: string;
  departments?: { name: string }[];
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export class GreenhouseSource extends BaseJobSource {
  readonly source: JobSource = "GREENHOUSE";
  readonly name = "Greenhouse";

  isEnabled(): boolean {
    return (
      process.env.JOB_SOURCE_GREENHOUSE_ENABLED !== "false" &&
      getGreenhouseBoards().length > 0
    );
  }

  async fetchJobs(): Promise<RawJobListing[]> {
    const boards = getGreenhouseBoards();
    const listings: RawJobListing[] = [];

    for (const board of boards) {
      try {
        const data = await this.fetchJson<GreenhouseResponse>(
          `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`,
        );

        for (const job of data.jobs ?? []) {
          listings.push({
            source: this.source,
            externalId: `${board}:${job.id}`,
            sourceUrl: job.absolute_url,
            title: job.title,
            companyName: board.charAt(0).toUpperCase() + board.slice(1),
            description: job.content ? stripHtml(job.content) : job.title,
            descriptionHtml: job.content,
            applyUrl: job.absolute_url,
            location: job.location?.name,
            tags: job.departments?.map((d) => d.name) ?? [],
            postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
            rawPayload: { board, job },
          });
        }
      } catch (error) {
        console.error(`[Greenhouse] Board "${board}" failed:`, error);
      }
    }

    return listings;
  }
}
