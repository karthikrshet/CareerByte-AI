"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, ExternalLink, Trash2 } from "lucide-react";
import {
  removeApplicationAction,
  updateApplicationStatusAction,
} from "@/features/jobs/actions";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ApplicationStatus,
  Company,
  JobApplication,
  JobPosting,
  JobSkill,
} from "@prisma/client";

type ApplicationWithJob = JobApplication & {
  job: JobPosting & {
    company: Company;
    skills: JobSkill[];
  };
};

const STATUS_OPTIONS: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEWING",
  "OFFERED",
  "REJECTED",
  "WITHDRAWN",
];

const STATUS_VARIANT: Record<
  ApplicationStatus,
  "default" | "secondary" | "success" | "destructive" | "outline"
> = {
  SAVED: "outline",
  APPLIED: "default",
  SCREENING: "secondary",
  INTERVIEWING: "secondary",
  OFFERED: "success",
  REJECTED: "destructive",
  WITHDRAWN: "outline",
};

interface ApplicationListProps {
  applications: ApplicationWithJob[];
}

export function ApplicationList({ applications }: ApplicationListProps) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(applicationId: string, status: ApplicationStatus) {
    startTransition(async () => {
      const result = await updateApplicationStatusAction(applicationId, status);
      if (result.success) toast.success("Status updated");
      else toast.error(result.error);
    });
  }

  function handleRemove(applicationId: string) {
    startTransition(async () => {
      const result = await removeApplicationAction(applicationId);
      if (result.success) toast.success("Application removed");
      else toast.error(result.error);
    });
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium">No applications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Save jobs from the job search page to track them here.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/jobs">Browse jobs</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <Card key={app.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  <Link
                    href={`/dashboard/jobs/${app.job.id}`}
                    className="hover:underline"
                  >
                    {app.job.title}
                  </Link>
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {app.job.company.name}
                </CardDescription>
              </div>
              <Badge variant={STATUS_VARIANT[app.status]}>
                {app.status.toLowerCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={app.status}
                disabled={isPending}
                onChange={(e) =>
                  handleStatusChange(
                    app.id,
                    e.target.value as ApplicationStatus,
                  )
                }
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              {app.appliedAt && (
                <span className="text-xs text-muted-foreground">
                  Applied {formatDate(app.appliedAt)}
                </span>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={app.job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Apply
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleRemove(app.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
