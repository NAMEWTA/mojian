import {
  differenceInMinutes,
  format,
  isThisYear,
  isToday,
  isYesterday,
} from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { getLocale, t, tLocale, type Locale } from "@/i18n";

export function noteTitle(content: string): string {
  const line = content.split("\n").find((l) => l.trim()) ?? "";
  const stripped = line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/[*_`]/g, "")
    .trim();
  return stripped || t("defaults.untitled");
}

export function noteExcerpt(content: string): string {
  const lines = content.split("\n");
  let skippedTitle = false;
  const parts: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!skippedTitle) {
      skippedTitle = true;
      continue;
    }
    const cleaned = line
      .replace(/^#{1,6}\s+/, "")
      .replace(/^>\s+/, "")
      .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/, "")
      .replace(/^[-*+]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .replace(/[*_`]/g, "");
    if (cleaned) parts.push(cleaned);
    if (parts.join(" ").length > 88) break;
  }
  return parts.join(" ").slice(0, 88);
}

export function formatLastEdited(ts: number, now = Date.now(), locale: Locale = getLocale()): string {
  const date = new Date(ts);
  const minutes = differenceInMinutes(now, date);
  if (minutes < 1) return tLocale(locale, "time.justNow");
  if (minutes < 60) return tLocale(locale, "time.minutesAgo", { n: minutes });
  const clock = format(date, "HH:mm");
  if (isToday(date)) return tLocale(locale, "time.today", { time: clock });
  if (isYesterday(date)) return tLocale(locale, "time.yesterday", { time: clock });
  const df = locale === "en" ? enUS : zhCN;
  if (isThisYear(date)) {
    return format(date, locale === "en" ? "MMM d HH:mm" : "M月d日 HH:mm", { locale: df });
  }
  return format(date, locale === "en" ? "MMM d, yyyy" : "yyyy年M月d日", { locale: df });
}

export function charCount(content: string): number {
  return Array.from(content.replace(/\s/g, "")).length;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function filterNotes<T extends { content: string }>(
  notes: T[],
  search: string,
): T[] {
  const q = search.trim().toLowerCase();
  if (!q) return notes;
  return notes.filter((note) => {
    const title = noteTitle(note.content).toLowerCase();
    return title.includes(q) || note.content.toLowerCase().includes(q);
  });
}

export function sortNotes<T extends { updatedAt: number }>(notes: T[]): T[] {
  return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
}
