import { t } from "@/i18n";
import {
  formatBackupFilename,
  isBackupName,
  type BackupListItem,
} from "@/lib/backup";
import {
  isDesktopApp,
  nativeDeleteBackup,
  nativeGetBackupDir,
  nativeListBackups,
  nativePickBackupDir,
  nativeReadBackup,
  nativeWriteBackup,
} from "@/lib/desktop";
import { canPickDirectory, getBoundDirectoryHandle } from "@/lib/vault";

const IDB_NAME = "mojian-vault";
const IDB_STORE = "handles";
const BACKUP_KEY = "backup";

export type DestinationKind = "native" | "folder" | "opfs";

export type BackupDestination = {
  kind: DestinationKind;
  name: string;
  write: (name: string, json: string) => Promise<void>;
  list: () => Promise<BackupListItem[]>;
  read: (name: string) => Promise<string>;
  remove: (name: string) => Promise<void>;
};

let pickedHandle: FileSystemDirectoryHandle | null = null;

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandle(handle: FileSystemDirectoryHandle) {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(handle, BACKUP_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openIdb();
  const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(BACKUP_KEY);
    req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return handle;
}

async function ensurePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const mode = { mode: "readwrite" as const };
  if ((await handle.queryPermission(mode)) === "granted") return true;
  return (await handle.requestPermission(mode)) === "granted";
}

async function listFromHandle(handle: FileSystemDirectoryHandle): Promise<BackupListItem[]> {
  const rows: BackupListItem[] = [];
  for await (const [name, entry] of handle.entries()) {
    if (entry.kind !== "file" || !isBackupName(name)) continue;
    const file = await (entry as FileSystemFileHandle).getFile();
    rows.push({ name, size: file.size, mtime: file.lastModified });
  }
  rows.sort((a, b) => b.mtime - a.mtime || b.name.localeCompare(a.name));
  return rows;
}

function fromHandle(handle: FileSystemDirectoryHandle, kind: "folder" | "opfs", name: string): BackupDestination {
  return {
    kind,
    name,
    write: async (fileName, json) => {
      const file = await handle.getFileHandle(fileName, { create: true });
      const writable = await file.createWritable();
      await writable.write(json);
      await writable.close();
    },
    list: () => listFromHandle(handle),
    read: async (fileName) => {
      const file = await handle.getFileHandle(fileName);
      return (await file.getFile()).text();
    },
    remove: async (fileName) => {
      await handle.removeEntry(fileName);
    },
  };
}

async function webHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (pickedHandle) {
    if (await ensurePermission(pickedHandle)) return pickedHandle;
    pickedHandle = null;
  }
  try {
    const stored = await loadHandle();
    if (!stored) return null;
    if (!(await ensurePermission(stored))) return null;
    pickedHandle = stored;
    return stored;
  } catch {
    return null;
  }
}

async function opfsHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.getDirectory) return null;
  try {
    const root = await navigator.storage.getDirectory();
    return await root.getDirectoryHandle("mojian-backups", { create: true });
  } catch {
    return null;
  }
}

function nativeDest(dir: string): BackupDestination {
  return {
    kind: "native",
    name: dir,
    write: async (name, json) => {
      await nativeWriteBackup(name, json);
    },
    list: async () => nativeListBackups(),
    read: (name) => nativeReadBackup(name),
    remove: (name) => nativeDeleteBackup(name),
  };
}

export async function resolveBackupDestination(): Promise<BackupDestination | null> {
  if (isDesktopApp()) {
    const dir = await nativeGetBackupDir();
    return nativeDest(dir);
  }

  const picked = await webHandle();
  if (picked) return fromHandle(picked, "folder", picked.name);

  const vault = getBoundDirectoryHandle();
  if (vault && (await ensurePermission(vault))) {
    const nested = await vault.getDirectoryHandle("backups", { create: true });
    return fromHandle(nested, "folder", `${vault.name}/backups`);
  }

  const opfs = await opfsHandle();
  if (opfs) return fromHandle(opfs, "opfs", t("data.backupOpfs"));

  return null;
}

export async function pickBackupDirectory(): Promise<BackupDestination | null> {
  if (isDesktopApp()) {
    const dir = await nativePickBackupDir();
    if (!dir) return null;
    return nativeDest(dir);
  }
  if (!canPickDirectory()) {
    throw new Error(t("data.noPicker"));
  }
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  pickedHandle = handle;
  await saveHandle(handle);
  return fromHandle(handle, "folder", handle.name);
}

export async function nextBackupName(dest: BackupDestination, at = new Date()): Promise<string> {
  const existing = await dest.list();
  return formatBackupFilename(
    at,
    existing.map((row) => row.name),
  );
}

export function canUseOpfs(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function";
}
