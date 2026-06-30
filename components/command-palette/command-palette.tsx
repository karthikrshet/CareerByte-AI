"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { commandPaletteItems } from "@/config/navigation";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  function navigate(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {commandPaletteItems.map((item) => (
            <CommandItem
              key={item.href}
              value={`${item.title} ${item.description ?? ""}`}
              onSelect={() => navigate(item.href)}
            >
              <span>{item.title}</span>
              {item.description && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {item.description}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => navigate("/dashboard/jobs")}>
            Browse jobs
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/applications")}>
            View applications
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/resumes")}>
            Upload resume
          </CommandItem>
          <CommandItem onSelect={() => navigate("/dashboard/settings")}>
            Open settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
