import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  BACKUP_INTERVALS,
  KEEP_COUNTS,
  SIZE_PRESETS,
  formatBytes,
  parseBackupName,
  type BackupListItem,
  type KeepCount,
  type RetentionMode,
} from "@/lib/backup";
import { useBackupStore } from "@/lib/backup-store";
import {
  chooseBackupDirectory,
  listScheduledBackups,
  readScheduledBackup,
  runBackup,
  syncBackupDestination,
} from "@/lib/backup-runner";
import { formatLastEdited } from "@/lib/notes/format";
import {
  applySnapshot,
  canPickDirectory,
  downloadBackup,
  importBackupFile,
  isBackupFile,
  pickDirectory,
  restoreDirectory,
  useVaultUi,
  writeToDirectory,
} from "@/lib/vault";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

function Chip({
  active,
  children,
  onClick,
  disabled,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:text-foreground",
        disabled && "opacity-50",
      )}
    >
      {children}
    </button>
  );
}

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
  const enabled = useBackupStore((s) => s.enabled);
  const backupOnOpen = useBackupStore((s) => s.backupOnOpen);
  const interval = useBackupStore((s) => s.interval);
  const retentionMode = useBackupStore((s) => s.retentionMode);
  const keepCount = useBackupStore((s) => s.keepCount);
  const maxBytes = useBackupStore((s) => s.maxBytes);
  const lastBackupAt = useBackupStore((s) => s.lastBackupAt);
  const lastBackupName = useBackupStore((s) => s.lastBackupName);
  const lastError = useBackupStore((s) => s.lastError);
  const destinationName = useBackupStore((s) => s.destinationName);
  const destinationKind = useBackupStore((s) => s.destinationKind);
  const setEnabled = useBackupStore((s) => s.setEnabled);
  const setBackupOnOpen = useBackupStore((s) => s.setBackupOnOpen);
  const setBackupInterval = useBackupStore((s) => s.setBackupInterval);
  const setRetentionMode = useBackupStore((s) => s.setRetentionMode);
  const setKeepCount = useBackupStore((s) => s.setKeepCount);
  const setMaxBytes = useBackupStore((s) => s.setMaxBytes);
  const markError = useBackupStore((s) => s.markError);
  const [busy, setBusy] = useState(false);
  const [backups, setBackups] = useState<BackupListItem[]>([]);
  const [restoreName, setRestoreName] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  async function refreshList() {
    try {
      setBackups(await listScheduledBackups());
    } catch {
      setBackups([]);
    }
  }

  useEffect(() => {
    if (!open) return;
    setNow(Date.now());
    setStatus({ supported: canPickDirectory() });
    void (async () => {
      await Promise.resolve(useBackupStore.persist.rehydrate());
      await syncBackupDestination();
      await refreshList();
    })();
  }, [open, lastBackupName, setStatus]);

  async function bindFolder() {
    setBusy(true);
    try {
      await pickDirectory();
      await syncBackupDestination();
      await refreshList();
    } catch (error) {
      const text = error instanceof Error ? error.message : t("data.aborted");
      if (!text.includes("abort") && !text.includes("Abort")) {
        setStatus({ message: text });
      }
    } finally {
      setBusy(false);
    }
  }

  async function bindBackupFolder() {
    setBusy(true);
    try {
      await chooseBackupDirectory();
      await refreshList();
    } catch (error) {
      const text = error instanceof Error ? error.message : t("data.aborted");
      if (!text.includes("abort") && !text.includes("Abort")) {
        markError(text);
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

  async function onBackupNow() {
    setBusy(true);
    try {
      const result = await runBackup("manual");
      if (result.ok && "name" in result) {
        setStatus({ message: t("data.backupDone", { name: result.name }) });
        await refreshList();
      } else if (!result.ok) {
        setStatus({
          message: result.error === "no-dest" ? t("data.backupNeedFolder") : t("data.backupFail"),
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmRestore() {
    const name = restoreName;
    setRestoreName(null);
    if (!name) return;
    setBusy(true);
    try {
      const text = await readScheduledBackup(name);
      const parsed = JSON.parse(text) as unknown;
      if (!isBackupFile(parsed)) throw new Error(t("data.notBackup"));
      applySnapshot(parsed);
      await writeToDirectory();
      setStatus({ message: t("data.restored") });
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : t("data.importFail"),
      });
    } finally {
      setBusy(false);
    }
  }

  const localeTag = locale === "zh" ? "zh-CN" : "en-US";
  const destLabel =
    destinationKind === "unset" || !destinationName
      ? t("data.backupUnset")
      : t("data.backupBound", { name: destinationName });
  const shown = backups.slice(0, 8);
  const backupNotice =
    lastError === "no-dest"
      ? t("data.backupNeedFolder")
      : lastError
        ? t("data.backupFail")
        : null;

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="dialog-panel-lg">
          <DialogTitle>{t("data.title")}</DialogTitle>
          <DialogDescription>{t("data.desc")}</DialogDescription>

          <section className="mt-4 rounded-xl bg-secondary p-3">
            <h3 className="text-sm font-medium">{t("data.folder")}</h3>
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
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={busy || !supported} onClick={() => void bindFolder()}>
                {bound ? t("data.replace") : t("data.pick")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void restoreDirectory()}
              >
                {t("data.reread")}
              </Button>
            </div>
          </section>

          <section className="mt-3 rounded-xl bg-secondary p-3">
            <h3 className="text-sm font-medium">{t("data.schedule")}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("data.scheduleHint")}</p>

            <p className="mt-2 text-sm">{destLabel}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || !canPickDirectory()}
                onClick={() => void bindBackupFolder()}
              >
                {destinationKind === "unset" ? t("data.backupPick") : t("data.backupChange")}
              </Button>
              <Button type="button" size="sm" disabled={busy} onClick={() => void onBackupNow()}>
                {busy ? t("data.backupRunning") : t("data.backupNow")}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={downloadBackup}>
                {t("data.export")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
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

            <label className="mt-3 flex min-h-11 items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{t("data.onOpen")}</span>
                <span className="block text-xs leading-relaxed text-muted-foreground">
                  {t("data.onOpenHint")}
                </span>
              </span>
              <Switch
                checked={backupOnOpen}
                onCheckedChange={setBackupOnOpen}
                aria-label={t("data.onOpen")}
              />
            </label>

            <label className="mt-2 flex min-h-11 items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{t("data.periodic")}</span>
                <span className="block text-xs leading-relaxed text-muted-foreground">
                  {t("data.periodicHint")}
                </span>
              </span>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                aria-label={t("data.periodic")}
              />
            </label>

            <p className="mt-3 text-xs font-medium text-muted-foreground">{t("data.interval")}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t("data.interval")}>
              {BACKUP_INTERVALS.map((id) => (
                <Chip
                  key={id}
                  active={interval === id}
                  disabled={!enabled}
                  onClick={() => setBackupInterval(id)}
                >
                  {t(`data.interval.${id}`)}
                </Chip>
              ))}
            </div>

            <p className="mt-3 text-xs font-medium text-muted-foreground">{t("data.retention")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("data.retentionHint")}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t("data.retention")}>
              {(["count", "size", "both"] as RetentionMode[]).map((id) => (
                <Chip key={id} active={retentionMode === id} onClick={() => setRetentionMode(id)}>
                  {t(`data.retention.${id}`)}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {retentionMode !== "size" ? (
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground">{t("data.keep")}</span>
                  <select
                    className="h-10 cursor-pointer rounded-lg border border-border bg-card px-2 text-sm shadow-border"
                    value={keepCount}
                    onChange={(event) => setKeepCount(Number(event.target.value) as KeepCount)}
                  >
                    {KEEP_COUNTS.map((n) => (
                      <option key={n} value={n}>
                        {t(`data.keep.${n}`)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {retentionMode !== "count" ? (
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground">{t("data.maxSize")}</span>
                  <select
                    className="h-10 cursor-pointer rounded-lg border border-border bg-card px-2 text-sm shadow-border"
                    value={maxBytes}
                    onChange={(event) => setMaxBytes(Number(event.target.value))}
                  >
                    {SIZE_PRESETS.map((n) => (
                      <option key={n} value={n}>
                        {n >= 1024 * 1024 * 1024 ? t("data.size.1gb") : n >= 200 * 1024 * 1024 ? t("data.size.200mb") : t("data.size.50mb")}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              {lastBackupAt
                ? t("data.lastBackup", { time: formatLastEdited(lastBackupAt, now, locale) })
                : t("data.lastBackupNever")}
              {lastBackupName ? ` · ${lastBackupName}` : ""}
            </p>

            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t("data.recent")}
                {backups.length ? ` · ${t("data.recentMore", { n: backups.length })}` : ""}
              </p>
              {shown.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">{t("data.recentEmpty")}</p>
              ) : (
                <ul className="mt-1 divide-y divide-border">
                  {shown.map((row) => {
                    const parsed = parseBackupName(row.name);
                    const label = parsed
                      ? `${parsed.day} ${parsed.clock.slice(0, 5)}`
                      : formatLastEdited(row.mtime, now, locale);
                    return (
                      <li key={row.name} className="flex items-center gap-2 py-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{label}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {row.name} · {formatBytes(row.size)}
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => setRestoreName(row.name)}
                        >
                          {t("data.restore")}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {backupNotice ? <p className="mt-4 text-sm text-muted-foreground">{backupNotice}</p> : null}
          {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(restoreName)} onOpenChange={(next) => !next && setRestoreName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("data.restoreTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("data.restoreBody", { name: restoreName ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmRestore()}>
              {t("data.restore")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
