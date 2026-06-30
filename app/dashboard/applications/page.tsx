import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserApplications, getApplicationStats } from "@/lib/jobs/queries";
import { ApplicationList } from "@/features/applications/components/application-list";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Applications",
};

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [applications, stats] = await Promise.all([
    getUserApplications(session.user.id),
    getApplicationStats(session.user.id),
  ]);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">
          Track your saved and submitted job applications.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Applied</CardDescription>
            <CardTitle className="text-2xl">{stats.APPLIED ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Interviewing</CardDescription>
            <CardTitle className="text-2xl">
              {stats.INTERVIEWING ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Offers</CardDescription>
            <CardTitle className="text-2xl">{stats.OFFERED ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <ApplicationList applications={applications} />
    </div>
  );
}
