/** Native bridge for the Tauri 2 shell. The web preview never loads this path. */

export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(command, args);
}

export async function nativePickDirectory(): Promise<string | null> {
  return invoke<string | null>("pick_directory");
}

export async function nativeGetDataDir(): Promise<string> {
  return invoke<string>("get_data_dir");
}

export async function nativeReadData(): Promise<string | null> {
  return invoke<string | null>("read_data");
}

export async function nativeWriteData(json: string): Promise<void> {
  await invoke<void>("write_data", { json });
}

export async function nativeWriteAsset(name: string, data: string): Promise<string> {
  return invoke<string>("write_asset", { name, data });
}

export async function nativeReadAsset(name: string): Promise<string | null> {
  return invoke<string | null>("read_asset", { name });
}

export type NativeBackupInfo = {
  name: string;
  size: number;
  mtime: number;
};

export async function nativeGetBackupDir(): Promise<string> {
  return invoke<string>("get_backup_dir");
}

export async function nativePickBackupDir(): Promise<string | null> {
  return invoke<string | null>("pick_backup_dir");
}

export async function nativeWriteBackup(name: string, json: string): Promise<NativeBackupInfo> {
  return invoke<NativeBackupInfo>("write_backup", { name, json });
}

export async function nativeListBackups(): Promise<NativeBackupInfo[]> {
  return invoke<NativeBackupInfo[]>("list_backups");
}

export async function nativeReadBackup(name: string): Promise<string> {
  return invoke<string>("read_backup", { name });
}

export async function nativeDeleteBackup(name: string): Promise<void> {
  await invoke<void>("delete_backup", { name });
}

