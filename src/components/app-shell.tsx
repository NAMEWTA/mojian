import { HardDrive } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { DataSettings } from "@/components/data-settings";
import { InkMark } from "@/components/notes/ink-mark";
import { Button } from "@/components/ui/button";
import { useArchiveStore } from "@/lib/archive/store";
import { bindVaultSync, restoreDirectory } from "@/lib/vault";

export function AppShell({ children }: { children: ReactNode }) {
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
        <span className="font-serif text-base font-semibold tracking-tight">墨笺</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">档案工作台</span>
        <div className="ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="数据与备份"
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
