function parseList(envVar: string | undefined): string[] {
  if (!envVar?.trim()) return [];
  return envVar
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function getGreenhouseBoards(): string[] {
  return parseList(process.env.JOB_SOURCE_GREENHOUSE_BOARDS);
}

export function getLeverCompanies(): string[] {
  return parseList(process.env.JOB_SOURCE_LEVER_COMPANIES);
}

export function getAshbyBoards(): string[] {
  return parseList(process.env.JOB_SOURCE_ASHBY_BOARDS);
}

export const jobSourceConfig = {
  remoteOk: { enabled: process.env.JOB_SOURCE_REMOTEOK_ENABLED !== "false" },
  greenhouse: {
    enabled: process.env.JOB_SOURCE_GREENHOUSE_ENABLED !== "false",
    boards: getGreenhouseBoards(),
  },
  lever: {
    enabled: process.env.JOB_SOURCE_LEVER_ENABLED !== "false",
    companies: getLeverCompanies(),
  },
  ashby: {
    enabled: process.env.JOB_SOURCE_ASHBY_ENABLED !== "false",
    boards: getAshbyBoards(),
  },
  weWorkRemotely: {
    enabled: process.env.JOB_SOURCE_WWR_ENABLED !== "false",
  },
  himalayas: {
    enabled: process.env.JOB_SOURCE_HIMALAYAS_ENABLED !== "false",
  },
  jobicy: { enabled: process.env.JOB_SOURCE_JOBICY_ENABLED !== "false" },
} as const;
