import type { ParsedResume } from "@/lib/resume/parser-utils";
import type { ExtractedSkill } from "@/lib/resume/skill-extractor";

export interface AtsFeedbackItem {
  type: "success" | "warning" | "error";
  message: string;
  category: "formatting" | "keywords" | "structure" | "length";
}

export interface AtsScoreResult {
  overallScore: number;
  formattingScore: number;
  keywordScore: number;
  structureScore: number;
  lengthScore: number;
  feedback: AtsFeedbackItem[];
}

const IDEAL_WORD_COUNT_MIN = 300;
const IDEAL_WORD_COUNT_MAX = 800;
const MIN_SKILLS_FOR_GOOD_SCORE = 8;

const REQUIRED_SECTIONS = [
  "experience",
  "education",
  "skills",
  "summary",
];

export function calculateAtsScore(
  parsed: ParsedResume,
  skills: ExtractedSkill[],
): AtsScoreResult {
  const feedback: AtsFeedbackItem[] = [];

  const formattingScore = scoreFormatting(parsed, feedback);
  const keywordScore = scoreKeywords(skills, feedback);
  const structureScore = scoreStructure(parsed, feedback);
  const lengthScore = scoreLength(parsed, feedback);

  const overallScore = Math.round(
    formattingScore * 0.2 +
      keywordScore * 0.3 +
      structureScore * 0.3 +
      lengthScore * 0.2,
  );

  return {
    overallScore,
    formattingScore,
    keywordScore,
    structureScore,
    lengthScore,
    feedback,
  };
}

function scoreFormatting(
  parsed: ParsedResume,
  feedback: AtsFeedbackItem[],
): number {
  let score = 100;

  if (!parsed.hasEmail) {
    score -= 25;
    feedback.push({
      type: "error",
      message: "Missing email address — ATS systems need contact info",
      category: "formatting",
    });
  } else {
    feedback.push({
      type: "success",
      message: "Email address found",
      category: "formatting",
    });
  }

  if (!parsed.hasPhone) {
    score -= 15;
    feedback.push({
      type: "warning",
      message: "No phone number detected",
      category: "formatting",
    });
  }

  if (parsed.hasLinkedIn) {
    feedback.push({
      type: "success",
      message: "LinkedIn profile link detected",
      category: "formatting",
    });
  } else {
    score -= 5;
    feedback.push({
      type: "warning",
      message: "Consider adding a LinkedIn profile URL",
      category: "formatting",
    });
  }

  if (parsed.bulletPointCount < 3) {
    score -= 10;
    feedback.push({
      type: "warning",
      message: "Use bullet points to highlight achievements",
      category: "formatting",
    });
  } else {
    feedback.push({
      type: "success",
      message: `${parsed.bulletPointCount} bullet points found`,
      category: "formatting",
    });
  }

  return Math.max(0, score);
}

function scoreKeywords(
  skills: ExtractedSkill[],
  feedback: AtsFeedbackItem[],
): number {
  const count = skills.length;

  if (count >= MIN_SKILLS_FOR_GOOD_SCORE) {
    feedback.push({
      type: "success",
      message: `${count} skills identified — strong keyword density`,
      category: "keywords",
    });
    return Math.min(100, 60 + count * 3);
  }

  if (count >= 4) {
    feedback.push({
      type: "warning",
      message: `${count} skills found — aim for ${MIN_SKILLS_FOR_GOOD_SCORE}+ relevant keywords`,
      category: "keywords",
    });
    return 50 + count * 5;
  }

  feedback.push({
    type: "error",
    message: "Very few skills detected — add a dedicated skills section",
    category: "keywords",
  });
  return Math.max(20, count * 10);
}

function scoreStructure(
  parsed: ParsedResume,
  feedback: AtsFeedbackItem[],
): number {
  let score = 40;
  const sectionNames = parsed.sections.map((s) => s.name.toLowerCase());

  for (const required of REQUIRED_SECTIONS) {
    const found = sectionNames.some((name) => name.includes(required));
    if (found) {
      score += 15;
      feedback.push({
        type: "success",
        message: `"${required}" section detected`,
        category: "structure",
      });
    } else if (required !== "summary") {
      score -= 5;
      feedback.push({
        type: "warning",
        message: `Missing "${required}" section`,
        category: "structure",
      });
    }
  }

  if (parsed.sections.length >= 4) {
    feedback.push({
      type: "success",
      message: "Well-structured with multiple sections",
      category: "structure",
    });
  }

  return Math.min(100, Math.max(0, score));
}

function scoreLength(
  parsed: ParsedResume,
  feedback: AtsFeedbackItem[],
): number {
  const { wordCount } = parsed;

  if (wordCount >= IDEAL_WORD_COUNT_MIN && wordCount <= IDEAL_WORD_COUNT_MAX) {
    feedback.push({
      type: "success",
      message: `Word count (${wordCount}) is in the ideal range`,
      category: "length",
    });
    return 100;
  }

  if (wordCount < IDEAL_WORD_COUNT_MIN) {
    feedback.push({
      type: "warning",
      message: `Resume is short (${wordCount} words) — expand with quantified achievements`,
      category: "length",
    });
    return Math.max(30, (wordCount / IDEAL_WORD_COUNT_MIN) * 100);
  }

  feedback.push({
    type: "warning",
    message: `Resume is long (${wordCount} words) — consider trimming to one page`,
    category: "length",
  });
  return Math.max(50, 100 - ((wordCount - IDEAL_WORD_COUNT_MAX) / 20));
}
