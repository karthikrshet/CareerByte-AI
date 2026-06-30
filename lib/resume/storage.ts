import "server-only";

import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "resumes");

export const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = {
  "application/pdf": "PDF" as const,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX" as const,
};

export type AllowedFileType = (typeof ALLOWED_MIME_TYPES)[keyof typeof ALLOWED_MIME_TYPES];

export function getFileTypeFromMime(mime: string): AllowedFileType | null {
  return ALLOWED_MIME_TYPES[mime as keyof typeof ALLOWED_MIME_TYPES] ?? null;
}

export function getStoragePath(
  userId: string,
  resumeId: string,
  versionNumber: number,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(userId, resumeId, `v${versionNumber}`, safeName);
}

export async function saveResumeFile(
  storagePath: string,
  buffer: Buffer,
): Promise<string> {
  const fullPath = path.join(UPLOAD_ROOT, storagePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return fullPath;
}

export async function readResumeFile(storagePath: string): Promise<Buffer> {
  const fullPath = path.join(UPLOAD_ROOT, storagePath);
  return readFile(fullPath);
}

export async function deleteResumeFile(storagePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_ROOT, storagePath);
  try {
    await unlink(fullPath);
  } catch {
    // File may already be deleted
  }
}
