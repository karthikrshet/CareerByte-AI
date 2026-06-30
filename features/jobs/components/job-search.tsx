"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Search } from "lucide-react";
import { triggerIngestionAction } from "@/features/jobs/actions";
import { JobCard } from "@/features/jobs/components/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Company, JobPosting, JobSkill, JobSourceRecord } from "@prisma/client";

type JobWithRelations = JobPosting & {
  company: Company;
  skills: JobSkill[];
  sources: JobSourceRecord[];
};

interface JobSearchProps {
  jobs: JobWithRelations[];
  total: number;
  page: number;
  totalPages: number;
  query?: string;
}

export function JobSearch({
  jobs,
  total,
  page,
  totalPages,
  query,
}: JobSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSearch(formData: FormData) {
    const q = formData.get("q") as string;
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");
    router.push(`/dashboard/jobs?${params.toString()}`);
  }

  function handleIngest() {
    startTransition(async () => {
      const result = await triggerIngestionAction();
      if (result.success) {
        toast.success(
          `Ingested ${result.data.created} new jobs (${result.data.fetched} fetched)`,
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form action={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search jobs, companies, skills..."
              defaultValue={query}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Button
          variant="outline"
          disabled={isPending}
          onClick={handleIngest}
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          Sync jobs
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {total} job{total !== 1 ? "s" : ""} found
      </p>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium">No jobs found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Click &quot;Sync jobs&quot; to fetch listings from configured sources.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/dashboard/jobs?page=${page - 1}${query ? `&q=${query}` : ""}`}>
                Previous
              </a>
            </Button>
          )}
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/dashboard/jobs?page=${page + 1}${query ? `&q=${query}` : ""}`}>
                Next
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
