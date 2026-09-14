import { HardDrive } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { DataSettings } from "@/components/data-settings";
import { InkMark } from "@/components/notes/ink-mark";
import { Button } from "@/components/ui/button";
import { useArchiveStore } from "@/lib/archive/store";
import { bindVaultSync, restoreDirectory } from "@/lib/vault";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const [dataOpen, setDataOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      await Promise.resolve(useArchiveStore.persist.rehydrate());
      await restoreDirectory();
    })();
    return bindVaultSync();
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-hairline px-3 md:px-4">
        <InkMark className="size-5 text-primary" />
        <span className="font-serif text-base font-semibold tracking-tight">{t("app.name")}</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">{t("app.workbench")}</span>
        <div className="ml-auto flex items-center gap-1">
          <div
            className="flex rounded-full bg-secondary p-0.5"
            role="group"
            aria-label={t("header.language")}
          >
            <button
              type="button"
              className={cn(
                "h-7 rounded-full px-2.5 text-xs font-medium",
                locale === "zh"
                  ? "bg-card text-foreground shadow-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={locale === "zh"}
              onClick={() => setLocale("zh")}
            >
              {t("header.langZhShort")}
            </button>
            <button
              type="button"
              className={cn(
                "h-7 rounded-full px-2.5 text-xs font-medium",
                locale === "en"
                  ? "bg-card text-foreground shadow-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={locale === "en"}
              onClick={() => setLocale("en")}
            >
              {t("header.langEnShort")}
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("header.data")}
            onClick={() => setDataOpen(true)}
          >
            <HardDrive />
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      <DataSettings open={dataOpen} onClose={() => setDataOpen(false)} />
    </div>
  );
}
