import "server-only";

export interface ParsedResumeSection {
  name: string;
  content: string;
}

export interface ParsedResume {
  rawText: string;
  sections: ParsedResumeSection[];
  wordCount: number;
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinkedIn: boolean;
  bulletPointCount: number;
}

const SECTION_PATTERNS = [
  /^(experience|work experience|employment history)/i,
  /^(education|academic background)/i,
  /^(skills|technical skills|core competencies)/i,
  /^(projects|personal projects)/i,
  /^(certifications|licenses)/i,
  /^(summary|professional summary|objective|profile)/i,
  /^(achievements|accomplishments)/i,
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX =
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
const LINKEDIN_REGEX = /linkedin\.com\/in\/[\w-]+/i;

export function analyzeResumeText(rawText: string): ParsedResume {
  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);

  const sections: ParsedResumeSection[] = [];
  let currentSection: ParsedResumeSection | null = null;

  for (const line of lines) {
    const isSectionHeader =
      SECTION_PATTERNS.some((p) => p.test(line)) &&
      line.length < 60 &&
      !line.startsWith("•") &&
      !line.startsWith("-");

    if (isSectionHeader) {
      if (currentSection) sections.push(currentSection);
      currentSection = { name: line, content: "" };
    } else if (currentSection) {
      currentSection.content += (currentSection.content ? "\n" : "") + line;
    } else if (!currentSection && sections.length === 0) {
      currentSection = { name: "Header", content: line };
    }
  }
  if (currentSection) sections.push(currentSection);

  const words = normalized.split(/\s+/).filter(Boolean);
  const bulletPointCount = (normalized.match(/^[•\-\*]\s/gm) ?? []).length;

  return {
    rawText: normalized,
    sections,
    wordCount: words.length,
    hasEmail: EMAIL_REGEX.test(normalized),
    hasPhone: PHONE_REGEX.test(normalized),
    hasLinkedIn: LINKEDIN_REGEX.test(normalized),
    bulletPointCount,
  };
}
