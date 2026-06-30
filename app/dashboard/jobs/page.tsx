import type { Metadata } from "next";
import { searchJobs, getJobStats } from "@/lib/jobs/queries";
import { JobSearch } from "@/features/jobs/components/job-search";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Job Search",
};

interface JobsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const { jobs, total, totalPages } = await searchJobs({
    query: params.q,
    page,
    pageSize: 20,
  });
  const stats = await getJobStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Job Search</h1>
        <p className="text-muted-foreground">
          Discover jobs aggregated from RemoteOK, Greenhouse, Lever, Ashby, and
          more.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active listings</CardDescription>
            <CardTitle className="text-2xl">{stats.totalJobs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Companies</CardDescription>
            <CardTitle className="text-2xl">{stats.totalCompanies}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last sync</CardDescription>
            <CardTitle className="text-sm font-medium">
              {stats.lastIngestion?.completedAt
                ? new Date(stats.lastIngestion.completedAt).toLocaleString()
                : "Never"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {["REMOTEOK", "HIMALAYAS", "JOBICY", "WE_WORK_REMOTELY"].map(
          (source) => (
            <Badge key={source} variant="outline">
              {source.replace(/_/g, " ")}
            </Badge>
          ),
        )}
      </div>

      <JobSearch
        jobs={jobs}
        total={total}
        page={page}
        totalPages={totalPages}
        query={params.q}
      />
    </div>
  );
}
