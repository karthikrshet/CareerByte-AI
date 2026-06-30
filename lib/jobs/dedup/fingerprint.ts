import { createHash } from "crypto";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(
      /\b(inc|llc|ltd|corp|corporation|co|company|gmbh|plc)\b\.?/gi,
      "",
    )
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeLocation(location: string): string {
  return location
    .toLowerCase()
    .replace(/\b(remote|worldwide|global|anywhere)\b/gi, "remote")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateJobFingerprint(
  title: string,
  companyName: string,
  location?: string,
): string {
  const payload = [
    normalizeTitle(title),
    normalizeCompanyName(companyName),
    normalizeLocation(location ?? ""),
  ].join("|");

  return createHash("sha256").update(payload).digest("hex");
}

export function generateJobSlug(title: string, companySlug: string): string {
  const base = slugify(`${title}-${companySlug}`);
  return base.slice(0, 120);
}
