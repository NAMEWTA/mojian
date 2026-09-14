import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "@/components/app-shell";
import { ArchiveApp } from "@/components/archive/archive-app";
import { I18nBoot, initLocale } from "@/i18n";
import "@/styles.css";

initLocale();

const root = document.getElementById("root");
if (!root) {
  throw new Error("missing #root");
}

createRoot(root).render(
  <StrictMode>
    <I18nBoot>
      <AppShell>
        <ArchiveApp />
      </AppShell>
    </I18nBoot>
  </StrictMode>,
);
