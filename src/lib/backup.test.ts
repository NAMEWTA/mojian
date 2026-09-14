import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  backupsToPrune,
  dueForScheduledBackup,
  formatBackupFilename,
  formatBytes,
  isBackupName,
  parseBackupName,
  shouldSkipStartupBackup,
  STARTUP_SKIP_MS,
  totalBackupBytes,
  type BackupListItem,
} from "./backup.ts";

function item(name: string, size: number, mtime: number): BackupListItem {
  return { name, size, mtime };
}

describe("backup names", () => {
  it("formats a filesystem-safe local timestamp", () => {
    const name = formatBackupFilename(new Date(2026, 8, 14, 9, 5, 7));
    assert.equal(name, "mojian-backup-2026-09-14-090507.json");
    assert.equal(isBackupName(name), true);
  });

  it("adds a counter when the second is taken", () => {
    const at = new Date(2026, 8, 14, 9, 5, 7);
    const first = formatBackupFilename(at);
    const second = formatBackupFilename(at, [first]);
    assert.equal(second, "mojian-backup-2026-09-14-090507-2.json");
    assert.equal(isBackupName(second), true);
  });

  it("rejects path tricks", () => {
    assert.equal(isBackupName("../mojian-backup-2026-09-14-090507.json"), false);
    assert.equal(isBackupName("notes.json"), false);
    assert.equal(isBackupName("mojian-backup-2026-09-14.json"), false);
  });

  it("parses the clock back out", () => {
    const parsed = parseBackupName("mojian-backup-2026-09-14-142533.json");
    assert.ok(parsed);
    assert.equal(parsed.day, "2026-09-14");
    assert.equal(parsed.clock, "14:25:33");
  });
});

describe("retention", () => {
  const files = [
    item("mojian-backup-2026-09-01-010000.json", 40, 1),
    item("readme.txt", 999, 0),
    item("mojian-backup-2026-09-02-010000.json", 40, 2),
    item("mojian-backup-2026-09-03-010000.json", 40, 3),
    item("mojian-backup-2026-09-04-010000.json", 40, 4),
  ];

  it("keeps the newest N and ignores foreign files", () => {
    const drop = backupsToPrune(files, { mode: "count", keepCount: 2, maxBytes: 1 });
    assert.deepEqual(
      drop.map((file) => file.name),
      [
        "mojian-backup-2026-09-01-010000.json",
        "mojian-backup-2026-09-02-010000.json",
      ],
    );
  });

  it("drops oldest until the total size fits, never the newest", () => {
    const drop = backupsToPrune(files, { mode: "size", keepCount: 99, maxBytes: 50 });
    assert.deepEqual(
      drop.map((file) => file.name),
      [
        "mojian-backup-2026-09-01-010000.json",
        "mojian-backup-2026-09-02-010000.json",
        "mojian-backup-2026-09-03-010000.json",
      ],
    );
    assert.equal(totalBackupBytes(files.filter((f) => !drop.includes(f) && f.name.startsWith("mojian"))), 40);
  });

  it("applies count and size together", () => {
    const drop = backupsToPrune(files, { mode: "both", keepCount: 3, maxBytes: 50 });
    assert.equal(drop.length, 3);
    assert.ok(drop.every((file) => file.mtime < 4));
  });

  it("never deletes the only backup even when over the size cap", () => {
    const only = [item("mojian-backup-2026-09-14-010000.json", 9_000, 1)];
    assert.deepEqual(backupsToPrune(only, { mode: "size", keepCount: 1, maxBytes: 10 }), []);
  });
});

describe("schedule", () => {
  it("is due when nothing has been written yet", () => {
    assert.equal(dueForScheduledBackup(null, "1d", 1_000), true);
  });

  it("waits until the interval has elapsed", () => {
    const start = 1_000_000;
    assert.equal(dueForScheduledBackup(start, "1h", start + 59 * 60 * 1000), false);
    assert.equal(dueForScheduledBackup(start, "1h", start + 60 * 60 * 1000), true);
  });

  it("skips a second startup backup inside the debounce window", () => {
    const now = 50_000;
    assert.equal(shouldSkipStartupBackup(now - STARTUP_SKIP_MS + 1, now), true);
    assert.equal(shouldSkipStartupBackup(now - STARTUP_SKIP_MS, now), false);
    assert.equal(shouldSkipStartupBackup(null, now), false);
  });
});

describe("formatBytes", () => {
  it("uses compact units", () => {
    assert.equal(formatBytes(800), "800 B");
    assert.equal(formatBytes(2048), "2 KB");
    assert.equal(formatBytes(5.2 * 1024 * 1024), "5.2 MB");
  });
});
