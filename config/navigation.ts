import {
  Briefcase,
  Home,
  Search,
  Settings,
  FileText,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  disabled?: boolean;
}

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview and quick stats",
  },
  {
    title: "Job Search",
    href: "/dashboard/jobs",
    icon: Search,
    description: "Browse and discover jobs",
  },
  {
    title: "Applications",
    href: "/dashboard/applications",
    icon: Briefcase,
    description: "Track your job applications",
  },
  {
    title: "Resumes",
    href: "/dashboard/resumes",
    icon: FileText,
    description: "Manage and tailor resumes",
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    description: "Application insights",
    disabled: true,
  },
];

export const settingsNavItem: NavItem = {
  title: "Settings",
  href: "/dashboard/settings",
  icon: Settings,
  description: "Account and preferences",
};

export const commandPaletteItems = [
  ...mainNavItems,
  settingsNavItem,
].map(({ title, href, description }) => ({
  title,
  href,
  description,
}));
