import { z } from "zod";
import type { Theme } from "@/types";

export const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  emailNotifications: z.boolean(),
  jobAlerts: z.boolean(),
  weeklyDigest: z.boolean(),
  timezone: z.string().min(1),
  theme: z.enum(["light", "dark", "system"] satisfies [Theme, Theme, Theme]),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
