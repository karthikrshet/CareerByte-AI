import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getJobById } from "@/lib/jobs/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, ArrowLeft } from "lucide-react";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  return { title: job ? `${job.title} at ${job.company.name}` : "Job" };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const salary =
    job.salaryMin || job.salaryMax
      ? [
          job.salaryMin &&
            `$${job.salaryMin.toLocaleString()}`,
          job.salaryMax &&
            `$${job.salaryMax.toLocaleString()}`,
        ]
          .filter(Boolean)
          .join(" – ")
      : null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/jobs">
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">{job.company.name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {job.remotePolicy !== "UNKNOWN" && (
              <Badge variant="secondary">{job.remotePolicy.toLowerCase()}</Badge>
            )}
            {job.employmentType !== "UNKNOWN" && (
              <Badge variant="outline">
                {job.employmentType.replace("_", " ").toLowerCase()}
              </Badge>
            )}
            {job.location && <Badge variant="outline">{job.location}</Badge>}
            {salary && <Badge variant="outline">{salary}/yr</Badge>}
          </div>
        </div>
        <Button asChild>
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Apply now
          </a>
        </Button>
      </div>

      {job.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Required skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill.id} variant="secondary">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {job.description}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Sources: {job.sources.map((s) => s.source).join(", ")}
      </p>
    </div>
  );
}
