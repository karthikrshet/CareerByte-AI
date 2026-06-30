import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import type { AtsFeedbackItem } from "@/lib/resume/ats-scorer";
import type {
  AtsScore,
  Resume,
  ResumeSkill,
  ResumeVersion,
} from "@prisma/client";

type ResumeDetail = Resume & {
  versions: (ResumeVersion & {
    skills: ResumeSkill[];
    atsScore: AtsScore | null;
  })[];
};

interface ResumeDetailViewProps {
  resume: ResumeDetail;
}

function ScoreCard({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <Progress value={score} />
    </div>
  );
}

export function ResumeDetailView({ resume }: ResumeDetailViewProps) {
  const latest = resume.versions[0];

  if (!latest) {
    return (
      <p className="text-muted-foreground">No versions uploaded yet.</p>
    );
  }

  const feedback = (latest.atsScore?.feedback as AtsFeedbackItem[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{resume.title}</h1>
        {resume.isActive && <Badge variant="success">Active</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>ATS Score</CardTitle>
            <CardDescription>Version {latest.versionNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latest.atsScore ? (
              <>
                <div className="text-center">
                  <span className="text-4xl font-bold">
                    {latest.atsScore.overallScore}
                  </span>
                  <span className="text-muted-foreground">/100</span>
                </div>
                <Separator />
                <ScoreCard label="Keywords" score={latest.atsScore.keywordScore} />
                <ScoreCard label="Structure" score={latest.atsScore.structureScore} />
                <ScoreCard label="Formatting" score={latest.atsScore.formattingScore} />
                <ScoreCard label="Length" score={latest.atsScore.lengthScore} />
              </>
            ) : (
              <Badge variant="secondary">{latest.status}</Badge>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Skills</CardTitle>
              <CardDescription>
                {latest.skills.length} skills identified from your resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latest.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {latest.skills.map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                      <span className="ml-1 text-muted-foreground">
                        {Math.round(skill.confidence * 100)}%
                      </span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No skills extracted yet.
                </p>
              )}
            </CardContent>
          </Card>

          {feedback.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>ATS Feedback</CardTitle>
                <CardDescription>
                  Actionable recommendations to improve your score
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {feedback.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md border p-3 text-sm"
                  >
                    <Badge
                      variant={
                        item.type === "success"
                          ? "success"
                          : item.type === "warning"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {item.category}
                    </Badge>
                    <span>{item.message}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            {resume.versions.length} version
            {resume.versions.length !== 1 ? "s" : ""} on file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {resume.versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">
                    v{version.versionNumber} — {version.fileName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(version.createdAt)} ·{" "}
                    {(version.fileSize / 1024).toFixed(1)} KB · {version.fileType}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {version.atsScore && (
                    <Badge>{version.atsScore.overallScore}/100</Badge>
                  )}
                  <Badge variant="secondary">{version.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
