"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import db from "@/lib/db";
import { appThemeToPrisma } from "@/lib/theme";
import { settingsSchema } from "@/features/settings/schemas";
import type { ActionResult } from "@/types";

export async function updateSettingsAction(
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    emailNotifications: formData.get("emailNotifications") === "true",
    jobAlerts: formData.get("jobAlerts") === "true",
    weeklyDigest: formData.get("weeklyDigest") === "true",
    timezone: formData.get("timezone"),
    theme: formData.get("theme"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { name, theme, ...settings } = parsed.data;

  await db.$transaction([
    db.user.update({
      where: { id: session.user.id },
      data: { name },
    }),
    db.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        theme: appThemeToPrisma(theme),
        ...settings,
      },
      update: {
        theme: appThemeToPrisma(theme),
        ...settings,
      },
    }),
  ]);

  revalidatePath("/dashboard/settings");
  return { success: true, data: undefined };
}

export async function getSettingsData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      settings: true,
    },
  });
}
