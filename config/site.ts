export const siteConfig = {
  name: "JobPilot AI",
  description:
    "AI-powered job search assistant — track applications, tailor resumes, and land your next role.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    github: "https://github.com/jobpilot-ai",
    docs: "/docs",
  },
} as const;

export type SiteConfig = typeof siteConfig;
