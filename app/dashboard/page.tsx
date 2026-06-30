import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Upload, Search, Briefcase } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserWithSettings } from "@/lib/users";
import { getUserResumes } from "@/features/resumes/actions";
import { getJobStats, getApplicationStats } from "@/lib/jobs/queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await getUserWithSettings(session.user.id)
    : null;
  const resumes = await getUserResumes();
  const activeResume = resumes.find((r) => r.isActive);
  const latestScore = activeResume?.versions[0]?.atsScore?.overallScore;

  const [jobStats, appStats] = session?.user?.id
    ? await Promise.all([
        getJobStats(),
        getApplicationStats(session.user.id),
      ])
    : [{ totalJobs: 0 }, {}];

  const applicationTotal = Object.values(appStats).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your job search.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resumes</CardDescription>
            <CardTitle className="text-3xl">{resumes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active ATS Score</CardDescription>
            <CardTitle className="text-3xl">
              {latestScore !== undefined && latestScore !== null
                ? `${latestScore}/100`
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Jobs indexed</CardDescription>
            <CardTitle className="text-3xl">{jobStats.totalJobs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Applications</CardDescription>
            <CardTitle className="text-3xl">{applicationTotal}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resume Intelligence
            </CardTitle>
            <CardDescription>
              Upload a resume to get ATS scoring and skill extraction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/resumes">
                <Upload className="h-4 w-4" />
                {resumes.length > 0 ? "Manage resumes" : "Upload resume"}
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Job Discovery
            </CardTitle>
            <CardDescription>
              Browse {jobStats.totalJobs} jobs from 7 aggregated sources.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/jobs">
                <Search className="h-4 w-4" />
                Browse jobs
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/applications">
                <Briefcase className="h-4 w-4" />
                Applications
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
