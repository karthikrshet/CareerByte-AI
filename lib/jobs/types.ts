import type {
  EmploymentType,
  JobSource,
  RemotePolicy,
} from "@prisma/client";

export interface RawJobListing {
  source: JobSource;
  externalId: string;
  sourceUrl?: string;
  title: string;
  companyName: string;
  companyWebsite?: string;
  companyLogoUrl?: string;
  description: string;
  descriptionHtml?: string;
  applyUrl: string;
  location?: string;
  remotePolicy?: RemotePolicy;
  employmentType?: EmploymentType;
  salaryRaw?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  tags?: string[];
  postedAt?: Date;
  rawPayload?: unknown;
}

export interface IngestionStats {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
}

export interface IngestionResult extends IngestionStats {
  runId: string;
  source: JobSource | "ALL";
  errors: string[];
}

export interface JobSourceAdapter {
  readonly source: JobSource;
  readonly name: string;
  isEnabled(): boolean;
  fetchJobs(): Promise<RawJobListing[]>;
}

export interface JobSearchFilters {
  query?: string;
  remotePolicy?: RemotePolicy;
  employmentType?: EmploymentType;
  source?: JobSource;
  minSalary?: number;
  page?: number;
  pageSize?: number;
}
