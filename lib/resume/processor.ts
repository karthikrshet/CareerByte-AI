import "server-only";

import db from "@/lib/db";
import { parseResumeFile } from "@/lib/resume/parsers";
import { extractSkills } from "@/lib/resume/skill-extractor";
import { calculateAtsScore } from "@/lib/resume/ats-scorer";
import { readResumeFile } from "@/lib/resume/storage";
import type { ResumeFileType } from "@prisma/client";

export async function processResumeVersion(versionId: string): Promise<void> {
  await db.resumeVersion.update({
    where: { id: versionId },
    data: { status: "PROCESSING" },
  });

  try {
    const version = await db.resumeVersion.findUniqueOrThrow({
      where: { id: versionId },
    });

    const buffer = await readResumeFile(version.storagePath);
    const parsed = await parseResumeFile(buffer, version.fileType as ResumeFileType);
    const skills = extractSkills(parsed.rawText);
    const atsResult = calculateAtsScore(parsed, skills);

    await db.$transaction(async (tx) => {
      await tx.resumeSkill.deleteMany({ where: { versionId } });
      await tx.atsScore.deleteMany({ where: { versionId } });

      await tx.resumeVersion.update({
        where: { id: versionId },
        data: {
          status: "COMPLETED",
          rawText: parsed.rawText,
          parsedData: parsed,
          errorMessage: null,
          skills: {
            create: skills.map((skill) => ({
              name: skill.name,
              category: skill.category,
              confidence: skill.confidence,
              occurrences: skill.occurrences,
            })),
          },
          atsScore: {
            create: {
              overallScore: atsResult.overallScore,
              formattingScore: atsResult.formattingScore,
              keywordScore: atsResult.keywordScore,
              structureScore: atsResult.structureScore,
              lengthScore: atsResult.lengthScore,
              feedback: atsResult.feedback,
            },
          },
        },
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process resume";

    await db.resumeVersion.update({
      where: { id: versionId },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });

    throw error;
  }
}
