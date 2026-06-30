import type { SkillCategory } from "@prisma/client";

export interface ExtractedSkill {
  name: string;
  category: SkillCategory;
  confidence: number;
  occurrences: number;
}

interface SkillDefinition {
  name: string;
  category: SkillCategory;
  aliases?: string[];
}

const SKILL_DATABASE: SkillDefinition[] = [
  // Languages
  { name: "JavaScript", category: "TECHNICAL", aliases: ["JS", "ECMAScript"] },
  { name: "TypeScript", category: "TECHNICAL", aliases: ["TS"] },
  { name: "Python", category: "TECHNICAL" },
  { name: "Java", category: "TECHNICAL" },
  { name: "C#", category: "TECHNICAL", aliases: ["C Sharp", "CSharp"] },
  { name: "Go", category: "TECHNICAL", aliases: ["Golang"] },
  { name: "Rust", category: "TECHNICAL" },
  { name: "Ruby", category: "TECHNICAL" },
  { name: "PHP", category: "TECHNICAL" },
  { name: "Swift", category: "TECHNICAL" },
  { name: "Kotlin", category: "TECHNICAL" },
  { name: "SQL", category: "TECHNICAL" },
  { name: "HTML", category: "TECHNICAL" },
  { name: "CSS", category: "TECHNICAL" },
  { name: "R", category: "TECHNICAL" },

  // Frameworks & Libraries
  { name: "React", category: "TECHNICAL", aliases: ["React.js", "ReactJS"] },
  { name: "Next.js", category: "TECHNICAL", aliases: ["NextJS"] },
  { name: "Node.js", category: "TECHNICAL", aliases: ["NodeJS"] },
  { name: "Vue.js", category: "TECHNICAL", aliases: ["Vue", "VueJS"] },
  { name: "Angular", category: "TECHNICAL" },
  { name: "Express", category: "TECHNICAL", aliases: ["Express.js"] },
  { name: "Django", category: "TECHNICAL" },
  { name: "Flask", category: "TECHNICAL" },
  { name: "Spring Boot", category: "TECHNICAL", aliases: ["Spring"] },
  { name: "FastAPI", category: "TECHNICAL" },
  { name: "Tailwind CSS", category: "TECHNICAL", aliases: ["Tailwind"] },
  { name: "GraphQL", category: "TECHNICAL" },
  { name: "REST API", category: "TECHNICAL", aliases: ["RESTful"] },

  // Tools & Platforms
  { name: "Docker", category: "TOOL" },
  { name: "Kubernetes", category: "TOOL", aliases: ["K8s"] },
  { name: "AWS", category: "TOOL", aliases: ["Amazon Web Services"] },
  { name: "Azure", category: "TOOL", aliases: ["Microsoft Azure"] },
  { name: "GCP", category: "TOOL", aliases: ["Google Cloud"] },
  { name: "Git", category: "TOOL" },
  { name: "GitHub", category: "TOOL" },
  { name: "GitLab", category: "TOOL" },
  { name: "CI/CD", category: "TOOL" },
  { name: "Jenkins", category: "TOOL" },
  { name: "Terraform", category: "TOOL" },
  { name: "Linux", category: "TOOL" },
  { name: "PostgreSQL", category: "TOOL", aliases: ["Postgres"] },
  { name: "MongoDB", category: "TOOL" },
  { name: "Redis", category: "TOOL" },
  { name: "Elasticsearch", category: "TOOL" },
  { name: "Kafka", category: "TOOL", aliases: ["Apache Kafka"] },
  { name: "Jira", category: "TOOL" },
  { name: "Figma", category: "TOOL" },

  // Data & ML
  { name: "Machine Learning", category: "TECHNICAL", aliases: ["ML"] },
  { name: "Deep Learning", category: "TECHNICAL" },
  { name: "TensorFlow", category: "TECHNICAL" },
  { name: "PyTorch", category: "TECHNICAL" },
  { name: "Pandas", category: "TECHNICAL" },
  { name: "NumPy", category: "TECHNICAL" },
  { name: "Data Analysis", category: "TECHNICAL" },

  // Soft skills
  { name: "Leadership", category: "SOFT" },
  { name: "Communication", category: "SOFT" },
  { name: "Problem Solving", category: "SOFT" },
  { name: "Team Collaboration", category: "SOFT", aliases: ["Teamwork"] },
  { name: "Project Management", category: "SOFT" },
  { name: "Agile", category: "SOFT", aliases: ["Scrum", "Kanban"] },

  // Languages spoken
  { name: "English", category: "LANGUAGE" },
  { name: "Spanish", category: "LANGUAGE" },
  { name: "French", category: "LANGUAGE" },
  { name: "German", category: "LANGUAGE" },
  { name: "Mandarin", category: "LANGUAGE" },
  { name: "Hindi", category: "LANGUAGE" },
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(text: string, term: string): number {
  const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, "gi");
  return (text.match(regex) ?? []).length;
}

export function extractSkills(text: string): ExtractedSkill[] {
  const skillsSection = extractSkillsSection(text);
  const searchText = `${text}\n${skillsSection}`;
  const found = new Map<string, ExtractedSkill>();

  for (const skill of SKILL_DATABASE) {
    const terms = [skill.name, ...(skill.aliases ?? [])];
    let totalOccurrences = 0;

    for (const term of terms) {
      totalOccurrences += countOccurrences(searchText, term);
    }

    if (totalOccurrences === 0) continue;

    const inSkillsSection = terms.some(
      (t) => countOccurrences(skillsSection, t) > 0,
    );
    const confidence = Math.min(
      1,
      0.4 + totalOccurrences * 0.15 + (inSkillsSection ? 0.3 : 0),
    );

    found.set(skill.name, {
      name: skill.name,
      category: skill.category,
      confidence: Math.round(confidence * 100) / 100,
      occurrences: totalOccurrences,
    });
  }

  return Array.from(found.values()).sort(
    (a, b) => b.confidence - a.confidence || b.occurrences - a.occurrences,
  );
}

function extractSkillsSection(text: string): string {
  const match = text.match(
    /(?:skills|technical skills|core competencies)[:\s]*([\s\S]*?)(?:\n[A-Z][^\n]{2,40}\n|$)/i,
  );
  return match?.[1]?.trim() ?? "";
}
