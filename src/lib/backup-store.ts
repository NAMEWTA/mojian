import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { BackupInterval, KeepCount, RetentionMode } from "@/lib/backup";
import type { DestinationKind } from "@/lib/backup-dest";

export type BackupSettings = {
  enabled: boolean;
  backupOnOpen: boolean;
  interval: BackupInterval;
  retentionMode: RetentionMode;
  keepCount: KeepCount;
  maxBytes: number;
  lastBackupAt: number | null;
  lastBackupName: string | null;
  lastError: string | null;
  destinationName: string | null;
  destinationKind: DestinationKind | "unset";
  setEnabled: (enabled: boolean) => void;
  setBackupOnOpen: (backupOnOpen: boolean) => void;
  setBackupInterval: (interval: BackupInterval) => void;
  setRetentionMode: (retentionMode: RetentionMode) => void;
  setKeepCount: (keepCount: KeepCount) => void;
  setMaxBytes: (maxBytes: number) => void;
  setDestination: (name: string | null, kind: DestinationKind | "unset") => void;
  markSuccess: (name: string, at?: number) => void;
  markError: (message: string | null) => void;
};

const DEFAULT_MAX_BYTES = 200 * 1024 * 1024;

export const useBackupStore = create<BackupSettings>()(
  persist(
    (set) => ({
      enabled: true,
      backupOnOpen: true,
      interval: "1d",
      retentionMode: "count",
      keepCount: 30,
      maxBytes: DEFAULT_MAX_BYTES,
      lastBackupAt: null,
      lastBackupName: null,
      lastError: null,
      destinationName: null,
      destinationKind: "unset",
      setEnabled: (enabled) => set({ enabled }),
      setBackupOnOpen: (backupOnOpen) => set({ backupOnOpen }),
      setBackupInterval: (interval) => set({ interval }),
      setRetentionMode: (retentionMode) => set({ retentionMode }),
      setKeepCount: (keepCount) => set({ keepCount }),
      setMaxBytes: (maxBytes) => set({ maxBytes }),
      setDestination: (destinationName, destinationKind) =>
        set({ destinationName, destinationKind }),
      markSuccess: (name, at = Date.now()) =>
        set({
          lastBackupAt: at,
          lastBackupName: name,
          lastError: null,
        }),
      markError: (lastError) => set({ lastError }),
    }),
    {
      name: "mojian-backup",
      version: 1,
      skipHydration: true,
      storage:
        typeof window === "undefined" ? undefined : createJSONStorage(() => localStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        backupOnOpen: state.backupOnOpen,
        interval: state.interval,
        retentionMode: state.retentionMode,
        keepCount: state.keepCount,
        maxBytes: state.maxBytes,
        lastBackupAt: state.lastBackupAt,
        lastBackupName: state.lastBackupName,
        destinationName: state.destinationName,
        destinationKind: state.destinationKind,
      }),
    },
  ),
);
