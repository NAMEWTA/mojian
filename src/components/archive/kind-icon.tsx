import {
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Code,
  Compass,
  FileText,
  Flag,
  Flame,
  Folder,
  FolderOpen,
  Gift,
  Globe,
  Heart,
  Home,
  IdCard,
  Leaf,
  Library,
  Lightbulb,
  Map,
  Music,
  NotebookPen,
  Palette,
  Plane,
  Sparkles,
  Star,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { BookGlyph } from "@/lib/archive/types";
import { cn } from "@/lib/utils";

export type TreeKind = "book" | "entry" | "folder" | "file";

export const BOOK_ICONS: Record<BookGlyph, LucideIcon> = {
  library: Library,
  notes: NotebookPen,
  people: Users,
  company: Building2,
  star: Star,
  heart: Heart,
  home: Home,
  briefcase: Briefcase,
  globe: Globe,
  map: Map,
  calendar: Calendar,
  flag: Flag,
  music: Music,
  camera: Camera,
  palette: Palette,
  code: Code,
  leaf: Leaf,
  flame: Flame,
  sparkles: Sparkles,
  compass: Compass,
  gift: Gift,
  plane: Plane,
  lightbulb: Lightbulb,
  bookmark: Bookmark,
};

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
    const Icon = BOOK_ICONS[glyph] ?? Library;
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
