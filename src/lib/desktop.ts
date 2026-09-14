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
