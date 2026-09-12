import { clsx, type ClassValue } from "clsx";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) || /Mac OS X/.test(navigator.userAgent);
}

export function useModSymbol(): string {
  const [mod, setMod] = useState("Ctrl");
  useEffect(() => {
    setMod(isMacPlatform() ? "⌘" : "Ctrl");
  }, []);
  return mod;
}
