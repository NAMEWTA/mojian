import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ArchiveApp } from "@/components/archive/archive-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell>
      <ArchiveApp />
    </AppShell>
  );
}
