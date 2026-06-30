import "server-only";

import { analyzeResumeText } from "@/lib/resume/parser-utils";

export async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text;
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function parseResumeFile(
  buffer: Buffer,
  fileType: "PDF" | "DOCX",
): Promise<ReturnType<typeof analyzeResumeText>> {
  const rawText =
    fileType === "PDF" ? await parsePdf(buffer) : await parseDocx(buffer);

  if (!rawText.trim()) {
    throw new Error("Could not extract text from the uploaded file");
  }

  return analyzeResumeText(rawText);
}
