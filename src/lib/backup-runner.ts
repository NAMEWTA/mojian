import {
  backupsToPrune,
  dueForScheduledBackup,
  SCHEDULER_TICK_MS,
  shouldSkipStartupBackup,
  type BackupListItem,
} from "@/lib/backup";
import {
  nextBackupName,
  pickBackupDirectory,
  resolveBackupDestination,
  type BackupDestination,
} from "@/lib/backup-dest";
import { useBackupStore } from "@/lib/backup-store";
import { takeSnapshot } from "@/lib/vault";

let running = false;
let cachedDest: BackupDestination | null = null;

export type BackupRunResult =
  | { ok: true; name: string; pruned: number }
  | { ok: true; skipped: "recent" | "busy" | "no-dest" }
  | { ok: false; error: string };

async function dest(): Promise<BackupDestination | null> {
  if (cachedDest) return cachedDest;
  const resolved = await resolveBackupDestination();
  if (resolved) {
    cachedDest = resolved;
    useBackupStore.getState().setDestination(resolved.name, resolved.kind);
  } else {
    useBackupStore.getState().setDestination(null, "unset");
  }
  return resolved;
}

export async function syncBackupDestination(): Promise<BackupDestination | null> {
  cachedDest = null;
  return dest();
}

export async function chooseBackupDirectory(): Promise<BackupDestination | null> {
  const picked = await pickBackupDirectory();
  if (!picked) return dest();
  cachedDest = picked;
  useBackupStore.getState().setDestination(picked.name, picked.kind);
  return picked;
}

export async function listScheduledBackups(): Promise<BackupListItem[]> {
  const current = await dest();
  if (!current) return [];
  return current.list();
}

export async function readScheduledBackup(name: string): Promise<string> {
  const current = await dest();
  if (!current) throw new Error("no-dest");
  return current.read(name);
}

export async function runBackup(
  reason: "open" | "schedule" | "manual",
): Promise<BackupRunResult> {
  if (running) return { ok: true, skipped: "busy" };
  running = true;
  try {
    const settings = useBackupStore.getState();
    if (reason === "open" && shouldSkipStartupBackup(settings.lastBackupAt)) {
      return { ok: true, skipped: "recent" };
    }
    const current = await dest();
    if (!current) {
      if (reason === "manual") {
        settings.markError("no-dest");
        return { ok: false, error: "no-dest" };
      }
      return { ok: true, skipped: "no-dest" };
    }
    const name = await nextBackupName(current);
    const json = `${JSON.stringify(takeSnapshot(), null, 2)}\n`;
    await current.write(name, json);
    const listed = await current.list();
    const drop = backupsToPrune(listed, {
      mode: settings.retentionMode,
      keepCount: settings.keepCount,
      maxBytes: settings.maxBytes,
    });
    for (const file of drop) {
      await current.remove(file.name);
    }
    useBackupStore.getState().markSuccess(name);
    return { ok: true, name, pruned: drop.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "backup-failed";
    useBackupStore.getState().markError(message);
    return { ok: false, error: message };
  } finally {
    running = false;
  }
}

async function maybeScheduledBackup() {
  const settings = useBackupStore.getState();
  if (!settings.enabled) return;
  if (!dueForScheduledBackup(settings.lastBackupAt, settings.interval)) return;
  await runBackup("schedule");
}

export function startBackupScheduler(): () => void {
  if (typeof window === "undefined") return () => {};
  let cancelled = false;
  void (async () => {
    await Promise.resolve(useBackupStore.persist.rehydrate());
    if (cancelled) return;
    await syncBackupDestination();
    if (cancelled) return;
    const settings = useBackupStore.getState();
    if (settings.backupOnOpen) await runBackup("open");
    if (!cancelled) await maybeScheduledBackup();
  })();
  const id = window.setInterval(() => {
    void maybeScheduledBackup();
  }, SCHEDULER_TICK_MS);
  return () => {
    cancelled = true;
    window.clearInterval(id);
  };
}
