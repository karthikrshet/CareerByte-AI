import { extractSkills } from "@/lib/resume/skill-extractor";
import type { SkillCategory } from "@prisma/client";

export interface JobSkillInput {
  name: string;
  category: SkillCategory;
  confidence: number;
}

export function extractJobSkills(
  title: string,
  description: string,
  tags: string[] = [],
): JobSkillInput[] {
  const combined = [title, description, tags.join(" ")].join("\n");
  const skills = extractSkills(combined);

  // Boost confidence for explicit tags
  return skills.map((skill) => {
    const inTags = tags.some(
      (tag) => tag.toLowerCase() === skill.name.toLowerCase(),
    );
    return {
      name: skill.name,
      category: skill.category,
      confidence: inTags
        ? Math.min(1, skill.confidence + 0.2)
        : skill.confidence,
    };
  });
}
