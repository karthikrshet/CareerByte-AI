import { slugify, normalizeCompanyName } from "@/lib/jobs/dedup/fingerprint";
import db from "@/lib/db";

export interface NormalizedCompany {
  name: string;
  slug: string;
  website?: string;
  logoUrl?: string;
}

export function normalizeCompany(input: {
  name: string;
  website?: string;
  logoUrl?: string;
}): NormalizedCompany {
  const name = input.name.trim();
  const baseSlug = slugify(normalizeCompanyName(name) || name);

  return {
    name,
    slug: baseSlug || slugify(name) || "unknown-company",
    website: input.website?.trim() || undefined,
    logoUrl: input.logoUrl?.trim() || undefined,
  };
}

export async function upsertCompany(input: {
  name: string;
  website?: string;
  logoUrl?: string;
}) {
  const normalized = normalizeCompany(input);

  const existing = await db.company.findUnique({
    where: { slug: normalized.slug },
  });

  if (existing) {
    return db.company.update({
      where: { id: existing.id },
      data: {
        name: normalized.name,
        website: normalized.website ?? existing.website,
        logoUrl: normalized.logoUrl ?? existing.logoUrl,
      },
    });
  }

  let slug = normalized.slug;
  let suffix = 1;
  while (await db.company.findUnique({ where: { slug } })) {
    slug = `${normalized.slug}-${suffix++}`;
  }

  return db.company.create({
    data: { ...normalized, slug },
  });
}
