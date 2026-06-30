"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2,
  ExternalLink,
  MapPin,
  Bookmark,
  DollarSign,
} from "lucide-react";
import { saveJobAction } from "@/features/jobs/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Company, JobPosting, JobSkill, JobSourceRecord } from "@prisma/client";

type JobWithRelations = JobPosting & {
  company: Company;
  skills: JobSkill[];
  sources: JobSourceRecord[];
};

interface JobCardProps {
  job: JobWithRelations;
}

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max!);
}

export function JobCard({ job }: JobCardProps) {
  const [isPending, startTransition] = useTransition();
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  function handleSave() {
    startTransition(async () => {
      const result = await saveJobAction(job.id);
      if (result.success) toast.success("Job saved to applications");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg leading-tight">
              <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline">
                {job.title}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {job.company.name}
            </CardDescription>
          </div>
          {job.remotePolicy !== "UNKNOWN" && (
            <Badge variant="secondary">{job.remotePolicy.toLowerCase()}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
          )}
          {salary && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {salary}
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {job.description.slice(0, 200)}...
        </p>
        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 5).map((skill) => (
              <Badge key={skill.id} variant="outline" className="text-xs">
                {skill.name}
              </Badge>
            ))}
            {job.skills.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{job.skills.length - 5}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" />
            Apply
          </a>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={handleSave}
        >
          <Bookmark className="h-3 w-3" />
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}
