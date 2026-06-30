"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { uploadResumeAction } from "@/features/resumes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ResumeUploadFormProps {
  resumeId?: string;
  defaultTitle?: string;
}

export function ResumeUploadForm({
  resumeId,
  defaultTitle = "",
}: ResumeUploadFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (resumeId) formData.set("resumeId", resumeId);

    startTransition(async () => {
      const result = await uploadResumeAction(formData);
      if (result.success) {
        toast.success(
          resumeId ? "New version uploaded" : "Resume uploaded successfully",
        );
        router.push(`/dashboard/resumes/${result.data.resumeId}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{resumeId ? "Upload new version" : "Upload resume"}</CardTitle>
        <CardDescription>
          Supported formats: PDF, DOCX (max 5 MB). Skills and ATS score are
          computed automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {!resumeId && (
            <div className="space-y-2">
              <Label htmlFor="title">Resume title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Software Engineer Resume"
                defaultValue={defaultTitle}
                required
              />
            </div>
          )}
          {resumeId && (
            <input type="hidden" name="title" value={defaultTitle || "Resume"} />
          )}
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              ref={fileRef}
              required
            />
          </div>
          <Button type="submit" disabled={isPending}>
            <Upload className="h-4 w-4" />
            {isPending ? "Processing..." : "Upload & analyze"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
