import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSettingsData } from "@/features/settings/actions";
import { SettingsForm } from "@/features/settings/components/settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getSettingsData();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}
