import type { JobSource } from "@prisma/client";
import { JOB_FETCH_TIMEOUT_MS, JOB_FETCH_USER_AGENT } from "@/lib/jobs/constants";
import type { JobSourceAdapter, RawJobListing } from "@/lib/jobs/types";

export abstract class BaseJobSource implements JobSourceAdapter {
  abstract readonly source: JobSource;
  abstract readonly name: string;

  abstract isEnabled(): boolean;
  abstract fetchJobs(): Promise<RawJobListing[]>;

  protected async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": JOB_FETCH_USER_AGENT,
        Accept: "application/json",
        ...init?.headers,
      },
      signal: AbortSignal.timeout(JOB_FETCH_TIMEOUT_MS),
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(
        `${this.name} fetch failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  protected async fetchText(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: { "User-Agent": JOB_FETCH_USER_AGENT },
      signal: AbortSignal.timeout(JOB_FETCH_TIMEOUT_MS),
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(
        `${this.name} fetch failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.text();
  }

  protected stripTags(html: string): string {
    return html.replace(/<[^>]+>/g, "").trim();
  }
}

export type { RawJobListing };
