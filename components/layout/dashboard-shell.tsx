"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/command-palette/command-palette";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onOpenCommand={() => setCommandOpen(true)} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl p-6">{children}</div>
      </main>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
