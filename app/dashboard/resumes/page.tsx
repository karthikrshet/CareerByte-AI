import type { Metadata } from "next";
import { getUserResumes } from "@/features/resumes/actions";
import { ResumeList } from "@/features/resumes/components/resume-list";
import { ResumeUploadForm } from "@/features/resumes/components/resume-upload-form";

export const metadata: Metadata = {
  title: "Resumes",
};

export default async function ResumesPage() {
  const resumes = await getUserResumes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumes</h1>
        <p className="text-muted-foreground">
          Upload, version, and analyze your resumes with ATS scoring.
        </p>
      </div>

      <ResumeUploadForm />
      <ResumeList resumes={resumes} />
    </div>
  );
}
