import { useArchiveStore } from "@/lib/archive/store";
import type { ArchiveNode, Book, Entry } from "@/lib/archive/types";
import { useNotesStore } from "@/lib/notes/store";
import type { Note } from "@/lib/notes/types";
import { create } from "zustand";

const IDB_NAME = "mojian-vault";
const IDB_STORE = "handles";
const HANDLE_KEY = "directory";

export type BackupFile = {
  kind: "mojian-backup";
  version: 1;
  exportedAt: number;
  notes: Note[];
  archive: {
    books: Book[];
    entries: Entry[];
    docs: ArchiveNode[];
  };
};

type VaultUi = {
  supported: boolean;
  bound: boolean;
  folderName: string | null;
  lastWrite: number | null;
  message: string | null;
  setStatus: (patch: Partial<Omit<VaultUi, "setStatus">>) => void;
};

export const useVaultUi = create<VaultUi>((set) => ({
  supported: false,
  bound: false,
  folderName: null,
  lastWrite: null,
  message: null,
  setStatus: (patch) => set(patch),
}));

export function takeSnapshot(): BackupFile {
  const notes = useNotesStore.getState();
  const archive = useArchiveStore.getState();
  return {
    kind: "mojian-backup",
    version: 1,
    exportedAt: Date.now(),
    notes: notes.notes,
    archive: {
      books: archive.books,
      entries: archive.entries,
      docs: archive.docs,
    },
  };
}

export function applySnapshot(data: BackupFile) {
  useNotesStore.setState({
    notes: data.notes,
    selectedId: data.notes[0]?.id ?? null,
  });
  useArchiveStore.setState({
    books: data.archive.books,
    entries: data.archive.entries,
    docs: data.archive.docs,
    selectedBookId: data.archive.books[0]?.id ?? null,
    selectedEntryId: null,
    selectedDocId: null,
  });
}

export function isBackupFile(value: unknown): value is BackupFile {
  if (!value || typeof value !== "object") return false;
  const data = value as BackupFile;
  return data.kind === "mojian-backup" && data.version === 1 && Array.isArray(data.notes);
}

export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && Boolean(window.mojianDesktop);
}

export function canPickDirectory(): boolean {
  if (isDesktopApp()) return true;
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

async function writeDesktop(): Promise<void> {
  const api = window.mojianDesktop;
  if (!api) return;
  await api.writeData(`${JSON.stringify(takeSnapshot(), null, 2)}\n`);
  const folder = await api.getDataDir();
  useVaultUi.getState().setStatus({
    bound: true,
    folderName: folder,
    lastWrite: Date.now(),
    supported: true,
    message: null,
  });
}


function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandle(handle: FileSystemDirectoryHandle) {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openIdb();
  const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(HANDLE_KEY);
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

let boundHandle: FileSystemDirectoryHandle | null = null;

export async function writeToDirectory(handle = boundHandle): Promise<void> {
  if (isDesktopApp()) {
    await writeDesktop();
    return;
  }
  if (!handle) return;
  const file = await handle.getFileHandle("mojian.json", { create: true });
  const writable = await file.createWritable();
  await writable.write(`${JSON.stringify(takeSnapshot(), null, 2)}\n`);
  await writable.close();
  useVaultUi.getState().setStatus({ lastWrite: Date.now(), message: null });
}

export async function pickDirectory(): Promise<void> {
  if (isDesktopApp() && window.mojianDesktop) {
    const dir = await window.mojianDesktop.pickDirectory();
    if (!dir) return;
    useVaultUi.getState().setStatus({
      bound: true,
      folderName: dir,
      supported: true,
      message: `已绑定「${dir}」。可把此文件夹放进 iCloud、OneDrive 或坚果云。`,
    });
    await writeDesktop();
    return;
  }
  if (!canPickDirectory()) {
    throw new Error("当前浏览器不能选择文件夹。请用 Chrome 或 Edge，或改用导出备份。");
  }
  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  boundHandle = handle;
  await saveHandle(handle);
  useVaultUi.getState().setStatus({
    bound: true,
    folderName: handle.name,
    supported: true,
    message: `已绑定「${handle.name}」。可把此文件夹放进 iCloud、OneDrive 或坚果云。`,
  });
  await writeToDirectory(handle);
}

export async function restoreDirectory(): Promise<void> {
  if (isDesktopApp() && window.mojianDesktop) {
    const dir = await window.mojianDesktop.getDataDir();
    useVaultUi.getState().setStatus({
      supported: true,
      bound: Boolean(dir),
      folderName: dir,
    });
    const text = await window.mojianDesktop.readData();
    if (text) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (isBackupFile(parsed)) applySnapshot(parsed);
      } catch {
        useVaultUi.getState().setStatus({ message: "数据文件损坏，仍使用本机缓存。" });
      }
    } else {
      await writeDesktop();
    }
    return;
  }
  const supported = canPickDirectory();
  useVaultUi.getState().setStatus({ supported });
  if (!supported) return;
  try {
    const handle = await loadHandle();
    if (!handle) return;
    const ok = await ensurePermission(handle);
    if (!ok) {
      useVaultUi.getState().setStatus({
        bound: false,
        folderName: handle.name,
        message: "需要重新允许访问这个文件夹。",
      });
      return;
    }
    boundHandle = handle;
    useVaultUi.getState().setStatus({ bound: true, folderName: handle.name });
    const file = await handle.getFileHandle("mojian.json").catch(() => null);
    if (file) {
      const text = await (await file.getFile()).text();
      const parsed = JSON.parse(text) as unknown;
      if (isBackupFile(parsed)) applySnapshot(parsed);
    } else {
      await writeToDirectory(handle);
    }
  } catch {
    useVaultUi.getState().setStatus({
      message: "读取数据目录失败，仍使用本机缓存。",
    });
  }
}

export function downloadBackup() {
  const blob = new Blob([`${JSON.stringify(takeSnapshot(), null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `墨笺备份-${stamp}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importBackupFile(file: File) {
  const parsed = JSON.parse(await file.text()) as unknown;
  if (!isBackupFile(parsed)) throw new Error("不是墨笺备份文件。");
  applySnapshot(parsed);
  await writeToDirectory();
}

export function bindVaultSync() {
  let timer = 0;
  const flush = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      void writeToDirectory();
    }, 900);
  };
  const unsubNotes = useNotesStore.subscribe(flush);
  const unsubArchive = useArchiveStore.subscribe(flush);
  return () => {
    unsubNotes();
    unsubArchive();
    window.clearTimeout(timer);
  };
}
