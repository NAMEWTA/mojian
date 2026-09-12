import {
  differenceInMinutes,
  format,
  isThisYear,
  isToday,
  isYesterday,
} from "date-fns";
import { zhCN } from "date-fns/locale";

export function noteTitle(content: string): string {
  const line = content.split("\n").find((l) => l.trim()) ?? "";
  const stripped = line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/[*_`]/g, "")
    .trim();
  return stripped || "无标题";
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

export function formatLastEdited(ts: number, now = Date.now()): string {
  const date = new Date(ts);
  const minutes = differenceInMinutes(now, date);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (isToday(date)) return format(date, "今天 HH:mm", { locale: zhCN });
  if (isYesterday(date)) return format(date, "昨天 HH:mm", { locale: zhCN });
  if (isThisYear(date)) return format(date, "M月d日 HH:mm", { locale: zhCN });
  return format(date, "yyyy年M月d日", { locale: zhCN });
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
