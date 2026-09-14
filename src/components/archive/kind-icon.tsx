import {
  Briefcase,
  Building2,
  FileText,
  Folder,
  FolderOpen,
  IdCard,
  Library,
  NotebookPen,
  UserRound,
  Users,
} from "lucide-react";
import type { BookGlyph } from "@/lib/archive/types";
import { cn } from "@/lib/utils";

export type TreeKind = "book" | "entry" | "folder" | "file";

export function KindIcon({
  kind,
  glyph = "library",
  open = false,
  className,
}: {
  kind: TreeKind;
  glyph?: BookGlyph;
  open?: boolean;
  className?: string;
}) {
  if (kind === "book") {
    const Icon =
      glyph === "people"
        ? Users
        : glyph === "company"
          ? Building2
          : glyph === "notes"
            ? NotebookPen
            : Library;
    return (
      <span className={cn("kind-icon kind-icon-book", className)} data-glyph={glyph}>
        <Icon />
      </span>
    );
  }

  if (kind === "entry") {
    const Icon =
      glyph === "people" ? UserRound : glyph === "company" ? Briefcase : IdCard;
    return (
      <span className={cn("kind-icon kind-icon-entry", className)} data-glyph={glyph}>
        <Icon />
      </span>
    );
  }

  if (kind === "folder") {
    const Icon = open ? FolderOpen : Folder;
    return (
      <span className={cn("kind-icon kind-icon-folder", className)}>
        <Icon />
      </span>
    );
  }

  return (
    <span className={cn("kind-icon kind-icon-file", className)}>
      <FileText />
    </span>
  );
}
