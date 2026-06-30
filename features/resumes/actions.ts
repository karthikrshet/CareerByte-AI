"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { processResumeVersion } from "@/lib/resume/processor";
import {
  MAX_RESUME_SIZE,
  getFileTypeFromMime,
  getStoragePath,
  saveResumeFile,
} from "@/lib/resume/storage";
import { uploadResumeSchema } from "@/features/resumes/schemas";
import type { ActionResult } from "@/types";

export async function uploadResumeAction(
  formData: FormData,
): Promise<ActionResult<{ resumeId: string; versionId: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const file = formData.get("file") as File | null;
  const parsed = uploadResumeSchema.safeParse({
    title: formData.get("title"),
    resumeId: formData.get("resumeId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  if (!file || file.size === 0) {
    return { success: false, error: "Please select a file to upload" };
  }

  if (file.size > MAX_RESUME_SIZE) {
    return { success: false, error: "File must be smaller than 5 MB" };
  }

  const fileType = getFileTypeFromMime(file.type);
  if (!fileType) {
    return { success: false, error: "Only PDF and DOCX files are supported" };
  }

  const userId = session.user.id;
  const { title, resumeId: existingResumeId } = parsed.data;

  let resume = existingResumeId
    ? await db.resume.findFirst({
        where: { id: existingResumeId, userId },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      })
    : null;

  if (existingResumeId && !resume) {
    return { success: false, error: "Resume not found" };
  }

  if (!resume) {
    resume = await db.resume.create({
      data: {
        userId,
        title,
        isActive: true,
      },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    await db.resume.updateMany({
      where: { userId, id: { not: resume.id } },
      data: { isActive: false },
    });
  }

  const nextVersion = (resume.versions[0]?.versionNumber ?? 0) + 1;
  const storagePath = getStoragePath(
    userId,
    resume.id,
    nextVersion,
    file.name,
  );

  const buffer = Buffer.from(await file.arrayBuffer());
  await saveResumeFile(storagePath, buffer);

  const version = await db.resumeVersion.create({
    data: {
      resumeId: resume.id,
      versionNumber: nextVersion,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      storagePath,
      status: "PENDING",
    },
  });

  try {
    await processResumeVersion(version.id);
  } catch (error) {
    revalidatePath("/dashboard/resumes");
    const message =
      error instanceof Error ? error.message : "Processing failed";
    return { success: false, error: message };
  }

  revalidatePath("/dashboard/resumes");
  revalidatePath(`/dashboard/resumes/${resume.id}`);

  return {
    success: true,
    data: { resumeId: resume.id, versionId: version.id },
  };
}

export async function getUserResumes() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.resume.findMany({
    where: { userId: session.user.id },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: {
          atsScore: true,
          _count: { select: { skills: true } },
        },
      },
      _count: { select: { versions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getResumeById(resumeId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          skills: { orderBy: { confidence: "desc" } },
          atsScore: true,
        },
      },
    },
  });
}

export async function setActiveResumeAction(
  resumeId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
  });

  if (!resume) {
    return { success: false, error: "Resume not found" };
  }

  await db.$transaction([
    db.resume.updateMany({
      where: { userId: session.user.id },
      data: { isActive: false },
    }),
    db.resume.update({
      where: { id: resumeId },
      data: { isActive: true },
    }),
  ]);

  revalidatePath("/dashboard/resumes");
  return { success: true, data: undefined };
}

export async function deleteResumeAction(
  resumeId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
  });

  if (!resume) {
    return { success: false, error: "Resume not found" };
  }

  await db.resume.delete({ where: { id: resumeId } });
  revalidatePath("/dashboard/resumes");
  return { success: true, data: undefined };
}
