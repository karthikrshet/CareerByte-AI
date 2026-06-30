"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import db from "@/lib/db";
import { ensureUserSettings } from "@/lib/users";
import { loginSchema, registerSchema } from "@/features/auth/schemas";
import type { ActionResult } from "@/types";

export async function loginAction(
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: "Invalid email or password" };
    }

    return { success: true, data: { redirectTo: "/dashboard" } };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password" };
    }
    throw error;
  }
}

export async function registerAction(
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: { name, email, passwordHash },
  });

  await ensureUserSettings(user.id);

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: "Account created but sign-in failed. Please log in." };
    }

    return { success: true, data: { redirectTo: "/dashboard" } };
  } catch {
    return { success: false, error: "Account created but sign-in failed. Please log in." };
  }
}
