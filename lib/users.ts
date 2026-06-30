import { DEFAULT_USER_SETTINGS } from "@/lib/theme";
import db from "@/lib/db";
import type { UserWithSettings } from "@/types";

export async function getUserWithSettings(
  userId: string,
): Promise<UserWithSettings | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      settings: true,
    },
  });

  return user;
}

export async function ensureUserSettings(userId: string) {
  return db.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULT_USER_SETTINGS,
    },
    update: {},
  });
}

export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    include: { settings: true },
  });
}
