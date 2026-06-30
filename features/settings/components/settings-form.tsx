"use client";

import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { updateSettingsAction } from "@/features/settings/actions";
import { prismaThemeToApp } from "@/lib/theme";
import type { Theme } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserSettings } from "@prisma/client";

interface SettingsFormProps {
  user: {
    name: string | null;
    email: string;
    settings: UserSettings | null;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const { setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const [emailNotifications, setEmailNotifications] = useState(
    user.settings?.emailNotifications ?? true,
  );
  const [jobAlerts, setJobAlerts] = useState(user.settings?.jobAlerts ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(
    user.settings?.weeklyDigest ?? false,
  );

  const currentTheme: Theme = user.settings
    ? prismaThemeToApp(user.settings.theme)
    : "system";

  function handleSubmit(formData: FormData) {
    formData.set("emailNotifications", String(emailNotifications));
    formData.set("jobAlerts", String(jobAlerts));
    formData.set("weeklyDigest", String(weeklyDigest));

    startTransition(async () => {
      const result = await updateSettingsAction(formData);
      if (result.success) {
        const theme = formData.get("theme") as Theme;
        setTheme(theme);
        toast.success("Settings saved");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user.name ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how JobPilot looks on your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <select
              id="theme"
              name="theme"
              defaultValue={currentTheme}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your email preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about your account.
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Job alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about matching jobs.
              </p>
            </div>
            <Switch checked={jobAlerts} onCheckedChange={setJobAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Weekly digest</Label>
              <p className="text-sm text-muted-foreground">
                Summary of your job search activity.
              </p>
            </div>
            <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional</CardTitle>
          <CardDescription>Set your timezone for scheduling.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue={user.settings?.timezone ?? "UTC"}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
