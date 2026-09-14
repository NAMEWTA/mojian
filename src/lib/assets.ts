import { isDesktopApp, nativeReadAsset, nativeWriteAsset } from "@/lib/desktop";
import { readAssetFromBoundFolder, writeAssetToBoundFolder } from "@/lib/vault";

const IDB_NAME = "mojian-assets";
const IDB_ASSETS = "assets";
const ASSET_PREFIX = "assets/";

export function isImageFile(file: File): boolean {
  if (/image\/(png|jpeg|jpg|webp)/i.test(file.type)) return true;
  return /\.(png|jpe?g|webp)$/i.test(file.name);
}

export function extForImage(file: File): "png" | "jpg" | "webp" {
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  return "jpg";
}

export function assetFileName(ext: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${day}-${crypto.randomUUID()}.${ext}`;
}

export function isAssetPath(src: string | undefined | null): boolean {
  if (!src) return false;
  return src === ASSET_PREFIX || src.startsWith(ASSET_PREFIX) || src.startsWith(`./${ASSET_PREFIX}`);
}

export function assetBasename(src: string): string {
  return src.replace(/^\.?\/*assets\//, "").replace(/^.*\//, "");
}

function openAssetsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_ASSETS)) db.createObjectStore(IDB_ASSETS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(name: string, blob: Blob) {
  const db = await openAssetsDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_ASSETS, "readwrite");
    tx.objectStore(IDB_ASSETS).put(blob, name);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGet(name: string): Promise<Blob | null> {
  const db = await openAssetsDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(IDB_ASSETS, "readonly");
    const req = tx.objectStore(IDB_ASSETS).get(name);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

async function fileToBase64(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function saveImageFile(file: File): Promise<string> {
  const name = assetFileName(extForImage(file));
  if (isDesktopApp()) {
    const data = await fileToBase64(file);
    return nativeWriteAsset(name, data);
  }
  await idbPut(name, file);
  await writeAssetToBoundFolder(name, file);
  return `${ASSET_PREFIX}${name}`;
}

const urlCache = new Map<string, string>();

export async function resolveAssetUrl(src: string): Promise<string> {
  if (!isAssetPath(src)) return src;
  const name = assetBasename(src);
  const cached = urlCache.get(name);
  if (cached) return cached;

  if (isDesktopApp()) {
    const dataUrl = await nativeReadAsset(name);
    if (dataUrl) {
      urlCache.set(name, dataUrl);
      return dataUrl;
    }
    return src;
  }

  const blob = (await idbGet(name)) ?? (await readAssetFromBoundFolder(name));
  if (blob) {
    const url = URL.createObjectURL(blob);
    urlCache.set(name, url);
    return url;
  }
  return src;
}
