import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getResumeById } from "@/features/resumes/actions";
import { ResumeDetailView } from "@/features/resumes/components/resume-detail-view";
import { ResumeUploadForm } from "@/features/resumes/components/resume-upload-form";

interface ResumeDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ResumeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const resume = await getResumeById(id);
  return { title: resume?.title ?? "Resume" };
}

export default async function ResumeDetailPage({
  params,
}: ResumeDetailPageProps) {
  const { id } = await params;
  const resume = await getResumeById(id);

  if (!resume) notFound();

  return (
    <div className="space-y-6">
      <ResumeDetailView resume={resume} />
      <ResumeUploadForm resumeId={resume.id} defaultTitle={resume.title} />
    </div>
  );
}
