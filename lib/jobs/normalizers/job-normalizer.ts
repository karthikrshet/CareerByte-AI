import type { EmploymentType, RemotePolicy } from "@prisma/client";
import {
  HYBRID_KEYWORDS,
  ONSITE_KEYWORDS,
  REMOTE_KEYWORDS,
} from "@/lib/jobs/constants";
import { generateJobSlug } from "@/lib/jobs/dedup/fingerprint";
import type { RawJobListing } from "@/lib/jobs/types";

export interface NormalizedJob {
  title: string;
  slug: string;
  description: string;
  descriptionHtml?: string;
  applyUrl: string;
  location?: string;
  remotePolicy: RemotePolicy;
  employmentType: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  salaryRaw?: string;
  postedAt?: Date;
}

export function inferRemotePolicy(
  location?: string,
  description?: string,
  tags?: string[],
): RemotePolicy {
  const text = [location, description, ...(tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (REMOTE_KEYWORDS.some((kw) => text.includes(kw))) return "REMOTE";
  if (HYBRID_KEYWORDS.some((kw) => text.includes(kw))) return "HYBRID";
  if (ONSITE_KEYWORDS.some((kw) => text.includes(kw))) return "ONSITE";
  return "UNKNOWN";
}

export function inferEmploymentType(text: string): EmploymentType {
  const lower = text.toLowerCase();
  if (lower.includes("intern")) return "INTERNSHIP";
  if (lower.includes("contract") || lower.includes("contractor"))
    return "CONTRACT";
  if (lower.includes("freelance")) return "FREELANCE";
  if (lower.includes("part-time") || lower.includes("part time"))
    return "PART_TIME";
  if (lower.includes("temporary") || lower.includes("temp")) return "TEMPORARY";
  if (lower.includes("full-time") || lower.includes("full time"))
    return "FULL_TIME";
  return "UNKNOWN";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeJobListing(
  listing: RawJobListing,
  companySlug: string,
): NormalizedJob {
  const description =
    listing.description ||
    (listing.descriptionHtml ? stripHtml(listing.descriptionHtml) : "");

  const combinedText = [listing.title, description, listing.location].join(" ");

  return {
    title: listing.title.trim(),
    slug: generateJobSlug(listing.title, companySlug),
    description: description.trim(),
    descriptionHtml: listing.descriptionHtml,
    applyUrl: listing.applyUrl.trim(),
    location: listing.location?.trim() || undefined,
    remotePolicy:
      listing.remotePolicy ??
      inferRemotePolicy(listing.location, description, listing.tags),
    employmentType:
      listing.employmentType ?? inferEmploymentType(combinedText),
    salaryMin: listing.salaryMin,
    salaryMax: listing.salaryMax,
    salaryCurrency: listing.salaryCurrency ?? "USD",
    salaryPeriod: listing.salaryPeriod,
    salaryRaw: listing.salaryRaw,
    postedAt: listing.postedAt,
  };
}
