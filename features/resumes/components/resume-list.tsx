"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { FileText, Star, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  deleteResumeAction,
  setActiveResumeAction,
} from "@/features/resumes/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AtsScore, Resume, ResumeVersion } from "@prisma/client";

type ResumeWithMeta = Resume & {
  versions: (ResumeVersion & {
    atsScore: AtsScore | null;
    _count: { skills: number };
  })[];
  _count: { versions: number };
};

interface ResumeListProps {
  resumes: ResumeWithMeta[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function ResumeList({ resumes }: ResumeListProps) {
  const [isPending, startTransition] = useTransition();

  function handleSetActive(resumeId: string) {
    startTransition(async () => {
      const result = await setActiveResumeAction(resumeId);
      if (result.success) toast.success("Active resume updated");
      else toast.error(result.error);
    });
  }

  function handleDelete(resumeId: string) {
    if (!confirm("Delete this resume and all versions?")) return;
    startTransition(async () => {
      const result = await deleteResumeAction(resumeId);
      if (result.success) toast.success("Resume deleted");
      else toast.error(result.error);
    });
  }

  if (resumes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No resumes yet</p>
          <p className="text-sm text-muted-foreground">
            Upload your first resume to get ATS scoring and skill extraction.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {resumes.map((resume) => {
        const latest = resume.versions[0];
        const atsScore = latest?.atsScore?.overallScore;

        return (
          <Card key={resume.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">
                    <Link
                      href={`/dashboard/resumes/${resume.id}`}
                      className="hover:underline"
                    >
                      {resume.title}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {resume._count.versions} version
                    {resume._count.versions !== 1 ? "s" : ""}
                    {latest && ` · Updated ${formatDate(latest.createdAt)}`}
                  </CardDescription>
                </div>
                {resume.isActive && <Badge variant="success">Active</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {atsScore !== undefined && atsScore !== null ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ATS Score</span>
                    <span className={`font-semibold ${getScoreColor(atsScore)}`}>
                      {atsScore}/100
                    </span>
                  </div>
                  <Progress value={atsScore} />
                  <p className="text-xs text-muted-foreground">
                    {latest._count.skills} skills extracted
                  </p>
                </div>
              ) : (
                <Badge variant="secondary">
                  {latest?.status ?? "No versions"}
                </Badge>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/resumes/${resume.id}`}>View</Link>
                </Button>
                {!resume.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleSetActive(resume.id)}
                  >
                    <Star className="h-3 w-3" />
                    Set active
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(resume.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
