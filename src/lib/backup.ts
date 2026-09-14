/** Snapshot backup naming, intervals, and rolling retention. Pure; no I/O. */

export const BACKUP_PREFIX = "mojian-backup-";
export const BACKUP_SUFFIX = ".json";
export const STARTUP_SKIP_MS = 60_000;
export const SCHEDULER_TICK_MS = 30_000;

export const BACKUP_INTERVALS = ["15m", "1h", "6h", "1d", "7d"] as const;
export type BackupInterval = (typeof BACKUP_INTERVALS)[number];

export const INTERVAL_MS: Record<BackupInterval, number> = {
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

export const KEEP_COUNTS = [5, 10, 30, 50] as const;
export type KeepCount = (typeof KEEP_COUNTS)[number];

export const SIZE_PRESETS = [
  50 * 1024 * 1024,
  200 * 1024 * 1024,
  1024 * 1024 * 1024,
] as const;

export type RetentionMode = "count" | "size" | "both";

export type RetentionPolicy = {
  mode: RetentionMode;
  keepCount: number;
  maxBytes: number;
};

export type BackupListItem = {
  name: string;
  size: number;
  mtime: number;
};

const NAME_RE = /^mojian-backup-(\d{4}-\d{2}-\d{2})-(\d{6})(?:-(\d+))?\.json$/;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

export function isBackupName(name: string): boolean {
  if (name.includes("/") || name.includes("\\") || name.includes("..")) return false;
  return NAME_RE.test(name);
}

export function formatBackupFilename(at = new Date(), taken: Iterable<string> = []): string {
  const used = taken instanceof Set ? taken : new Set(taken);
  const day = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
  const time = `${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}`;
  const base = `${BACKUP_PREFIX}${day}-${time}`;
  let name = `${base}${BACKUP_SUFFIX}`;
  let n = 2;
  while (used.has(name)) {
    name = `${base}-${n}${BACKUP_SUFFIX}`;
    n += 1;
  }
  return name;
}

export function parseBackupName(name: string): { day: string; clock: string; at: number } | null {
  const match = NAME_RE.exec(name);
  if (!match) return null;
  const day = match[1];
  const raw = match[2];
  const clock = `${raw.slice(0, 2)}:${raw.slice(2, 4)}:${raw.slice(4, 6)}`;
  const at = Date.parse(`${day}T${clock}`);
  return { day, clock, at: Number.isNaN(at) ? 0 : at };
}

export function dueForScheduledBackup(
  lastBackupAt: number | null,
  interval: BackupInterval,
  now = Date.now(),
): boolean {
  if (lastBackupAt == null) return true;
  return now - lastBackupAt >= INTERVAL_MS[interval];
}

export function shouldSkipStartupBackup(lastBackupAt: number | null, now = Date.now()): boolean {
  return lastBackupAt != null && now - lastBackupAt < STARTUP_SKIP_MS;
}

export function totalBackupBytes(files: BackupListItem[]): number {
  return files.reduce((sum, file) => sum + file.size, 0);
}

export function backupsToPrune(
  files: BackupListItem[],
  policy: RetentionPolicy,
): BackupListItem[] {
  const owned = files
    .filter((file) => isBackupName(file.name))
    .sort((a, b) => a.mtime - b.mtime || a.name.localeCompare(b.name));
  const keep = [...owned];
  const drop: BackupListItem[] = [];

  const over = () => {
    if (keep.length <= 1) return false;
    if (policy.mode === "count" || policy.mode === "both") {
      if (keep.length > Math.max(1, policy.keepCount)) return true;
    }
    if (policy.mode === "size" || policy.mode === "both") {
      if (totalBackupBytes(keep) > policy.maxBytes) return true;
    }
    return false;
  };

  while (over()) {
    const oldest = keep.shift();
    if (!oldest) break;
    drop.push(oldest);
  }
  return drop;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) {
    const mb = n / (1024 * 1024);
    return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
  }
  const gb = n / (1024 * 1024 * 1024);
  return gb >= 10 ? `${Math.round(gb)} GB` : `${gb.toFixed(1)} GB`;
}
