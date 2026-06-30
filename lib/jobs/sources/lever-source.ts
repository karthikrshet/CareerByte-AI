import type { JobSource } from "@prisma/client";
import { getLeverCompanies } from "@/config/job-sources";
import { BaseJobSource } from "@/lib/jobs/sources/base-source";
import type { RawJobListing } from "@/lib/jobs/types";
import { stripHtml } from "@/lib/jobs/normalizers/job-normalizer";

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
  categories: {
    location?: string;
    team?: string;
    commitment?: string;
  };
  descriptionPlain?: string;
  description?: string;
}

export class LeverSource extends BaseJobSource {
  readonly source: JobSource = "LEVER";
  readonly name = "Lever";

  isEnabled(): boolean {
    return (
      process.env.JOB_SOURCE_LEVER_ENABLED !== "false" &&
      getLeverCompanies().length > 0
    );
  }

  async fetchJobs(): Promise<RawJobListing[]> {
    const companies = getLeverCompanies();
    const listings: RawJobListing[] = [];

    for (const company of companies) {
      try {
        const data = await this.fetchJson<LeverPosting[]>(
          `https://api.lever.co/v0/postings/${company}?mode=json`,
        );

        for (const posting of data ?? []) {
          listings.push({
            source: this.source,
            externalId: `${company}:${posting.id}`,
            sourceUrl: posting.hostedUrl,
            title: posting.text,
            companyName: company.charAt(0).toUpperCase() + company.slice(1),
            description:
              posting.descriptionPlain ??
              (posting.description ? stripHtml(posting.description) : posting.text),
            descriptionHtml: posting.description,
            applyUrl: posting.applyUrl || posting.hostedUrl,
            location: posting.categories?.location,
            tags: [
              posting.categories?.team,
              posting.categories?.commitment,
            ].filter(Boolean) as string[],
            postedAt: posting.createdAt
              ? new Date(posting.createdAt)
              : undefined,
            rawPayload: { company, posting },
          });
        }
      } catch (error) {
        console.error(`[Lever] Company "${company}" failed:`, error);
      }
    }

    return listings;
  }
}
