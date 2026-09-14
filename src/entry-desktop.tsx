import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "@/components/app-shell";
import { ArchiveApp } from "@/components/archive/archive-app";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("missing #root");
}

createRoot(root).render(
  <StrictMode>
    <AppShell>
      <ArchiveApp />
    </AppShell>
  </StrictMode>,
);
