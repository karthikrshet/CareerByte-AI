import type { Theme as PrismaTheme } from "@prisma/client";
import type { Theme } from "@/types";

const PRISMA_TO_APP: Record<PrismaTheme, Theme> = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

const APP_TO_PRISMA: Record<Theme, PrismaTheme> = {
  light: "LIGHT",
  dark: "DARK",
  system: "SYSTEM",
};

export function prismaThemeToApp(theme: PrismaTheme): Theme {
  return PRISMA_TO_APP[theme];
}

export function appThemeToPrisma(theme: Theme): PrismaTheme {
  return APP_TO_PRISMA[theme];
}

export const DEFAULT_USER_SETTINGS = {
  theme: "SYSTEM" as const,
  emailNotifications: true,
  jobAlerts: true,
  weeklyDigest: false,
  timezone: "UTC",
};
