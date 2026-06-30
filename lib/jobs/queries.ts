import type { JobSource } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import db from "@/lib/db";
import type { JobSearchFilters } from "@/lib/jobs/types";

export async function searchJobs(filters: JobSearchFilters = {}) {
  const {
    query,
    remotePolicy,
    employmentType,
    source,
    minSalary,
    page = 1,
    pageSize = 20,
  } = filters;

  const where: Prisma.JobPostingWhereInput = {
    isActive: true,
    ...(remotePolicy && { remotePolicy }),
    ...(employmentType && { employmentType }),
    ...(minSalary && { salaryMax: { gte: minSalary } }),
    ...(source && { sources: { some: { source } } }),
    ...(query && {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { company: { name: { contains: query, mode: "insensitive" } } },
        { skills: { some: { name: { contains: query, mode: "insensitive" } } } },
      ],
    }),
  };

  const [jobs, total] = await Promise.all([
    db.jobPosting.findMany({
      where,
      include: {
        company: true,
        skills: { orderBy: { confidence: "desc" }, take: 8 },
        sources: true,
        _count: { select: { applications: true } },
      },
      orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.jobPosting.count({ where }),
  ]);

  return { jobs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getJobById(jobId: string) {
  return db.jobPosting.findUnique({
    where: { id: jobId },
    include: {
      company: true,
      skills: { orderBy: { confidence: "desc" } },
      sources: true,
    },
  });
}

export async function getRecentIngestionRuns(limit = 10) {
  return db.ingestionRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function getJobStats() {
  const [totalJobs, totalCompanies, lastRun] = await Promise.all([
    db.jobPosting.count({ where: { isActive: true } }),
    db.company.count(),
    db.ingestionRun.findFirst({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  return { totalJobs, totalCompanies, lastIngestion: lastRun };
}

export async function getUserApplications(userId: string) {
  return db.jobApplication.findMany({
    where: { userId },
    include: {
      job: {
        include: {
          company: true,
          skills: { orderBy: { confidence: "desc" }, take: 5 },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getApplicationStats(userId: string) {
  const counts = await db.jobApplication.groupBy({
    by: ["status"],
    where: { userId },
    _count: true,
  });

  return counts.reduce(
    (acc, item) => {
      acc[item.status] = item._count;
      return acc;
    },
    {} as Record<string, number>,
  );
}
