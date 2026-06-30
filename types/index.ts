import type { User, UserSettings, Resume, ResumeVersion, AtsScore, ResumeSkill } from "@prisma/client";

export type SafeUser = Pick<
  User,
  "id" | "name" | "email" | "image" | "createdAt"
>;

export type UserWithSettings = SafeUser & {
  settings: UserSettings | null;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Theme = "light" | "dark" | "system";

export interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  interviews: number;
  offers: number;
}

export type ResumeWithLatestVersion = Resume & {
  versions: (ResumeVersion & {
    atsScore: AtsScore | null;
    skills: ResumeSkill[];
  })[];
};
