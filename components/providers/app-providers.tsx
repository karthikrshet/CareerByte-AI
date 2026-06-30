"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "sonner";
import type { Session } from "next-auth";

interface AppProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function AppProviders({ children, session }: AppProvidersProps) {
  return (
    <AuthProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </AuthProvider>
  );
}
