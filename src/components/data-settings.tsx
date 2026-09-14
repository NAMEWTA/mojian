import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  canPickDirectory,
  downloadBackup,
  importBackupFile,
  pickDirectory,
  restoreDirectory,
  useVaultUi,
} from "@/lib/vault";
import { useI18n } from "@/i18n";

export function DataSettings({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const supported = useVaultUi((s) => s.supported);
  const bound = useVaultUi((s) => s.bound);
  const folderName = useVaultUi((s) => s.folderName);
  const lastWrite = useVaultUi((s) => s.lastWrite);
  const message = useVaultUi((s) => s.message);
  const setStatus = useVaultUi((s) => s.setStatus);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setStatus({ supported: canPickDirectory() });
  }, [open, setStatus]);

  async function bindFolder() {
    setBusy(true);
    try {
      await pickDirectory();
    } catch (error) {
      const text = error instanceof Error ? error.message : t("data.aborted");
      if (!text.includes("abort") && !text.includes("Abort")) {
        setStatus({ message: text });
      }
    } finally {
      setBusy(false);
    }
  }

  async function onImport(file: File) {
    setBusy(true);
    try {
      await importBackupFile(file);
      setStatus({ message: t("data.imported") });
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : t("data.importFail"),
      });
    } finally {
      setBusy(false);
    }
  }

  const localeTag = locale === "zh" ? "zh-CN" : "en-US";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="dialog-panel-lg">
        <DialogTitle>{t("data.title")}</DialogTitle>
        <DialogDescription>{t("data.desc")}</DialogDescription>

        <section className="mt-5 rounded-xl bg-secondary p-4">
          <h3 className="text-sm font-medium">{t("data.folder")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("data.folderHint")}</p>
          <p className="mt-2 text-sm">
            {bound
              ? t("data.bound", { name: folderName ?? "" })
              : supported
                ? t("data.unbound")
                : t("data.unsupported")}
          </p>
          {lastWrite ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("data.lastWrite", { time: new Date(lastWrite).toLocaleString(localeTag) })}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" disabled={busy || !supported} onClick={() => void bindFolder()}>
              {bound ? t("data.replace") : t("data.pick")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void restoreDirectory()}
            >
              {t("data.reread")}
            </Button>
          </div>
        </section>

        <section className="mt-4 rounded-xl bg-secondary p-4">
          <h3 className="text-sm font-medium">{t("data.backup")}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("data.backupHint")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={downloadBackup}>
              {t("data.export")}
            </Button>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              {t("data.import")}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void onImport(file);
              }}
            />
          </div>
        </section>

        {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
