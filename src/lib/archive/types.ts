import { t } from "@/i18n";

export const FIELD_TYPES = [
  "text",
  "phone",
  "email",
  "url",
  "date",
  "select",
  "relation",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const BOOK_GLYPHS = [
  "library",
  "notes",
  "people",
  "company",
  "star",
  "heart",
  "home",
  "briefcase",
  "globe",
  "map",
  "calendar",
  "flag",
  "music",
  "camera",
  "palette",
  "code",
  "leaf",
  "flame",
  "sparkles",
  "compass",
  "gift",
  "plane",
  "lightbulb",
  "bookmark",
] as const;

export type BookGlyph = (typeof BOOK_GLYPHS)[number];

export type FieldDef = {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  relationBookId?: string;
};

export type Book = {
  id: string;
  name: string;
  fields: FieldDef[];
  glyph?: BookGlyph;
  createdAt: number;
  updatedAt: number;
};

export type Entry = {
  id: string;
  bookId: string;
  title: string;
  values: Record<string, string>;
  createdAt: number;
  updatedAt: number;
};

export type ArchiveNode = {
  id: string;
  entryId: string;
  parentId: string | null;
  kind: "folder" | "file";
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

export type FocusKind = "book" | "entry" | "folder" | "file";

export type DocLayout = "live" | "preview";

export function blankField(partial: Partial<FieldDef> = {}): FieldDef {
  return {
    id: crypto.randomUUID(),
    label: t("field.new"),
    type: "text",
    ...partial,
  };
}

export function isBookGlyph(value: unknown): value is BookGlyph {
  return typeof value === "string" && (BOOK_GLYPHS as readonly string[]).includes(value);
}

export function glyphForBook(book: Pick<Book, "id"> & { glyph?: BookGlyph }): BookGlyph {
  if (isBookGlyph(book.glyph)) return book.glyph;
  if (book.id === "book-demo" || book.id === "book-notes") return "notes";
  if (book.id === "book-people") return "people";
  if (book.id === "book-company") return "company";
  return "library";
}

export function pickUnusedGlyph(used: Array<BookGlyph | undefined | null>): BookGlyph {
  const taken = new Set(used.filter((glyph): glyph is BookGlyph => isBookGlyph(glyph)));
  const free = BOOK_GLYPHS.filter((glyph) => !taken.has(glyph));
  const pool = free.length ? free : BOOK_GLYPHS;
  return pool[Math.floor(Math.random() * pool.length)] ?? "library";
}

export function peopleFieldTemplate(): Array<Omit<FieldDef, "id">> {
  return [
    { label: t("template.phone"), type: "phone" },
    { label: t("template.email"), type: "email" },
    { label: t("template.role"), type: "text" },
    {
      label: t("template.howWeMet"),
      type: "select",
      options: [
        t("template.friend"),
        t("template.work"),
        t("template.event"),
        t("template.old"),
      ],
    },
  ];
}

export function companyFieldTemplate(): Array<Omit<FieldDef, "id">> {
  return [
    { label: t("template.industry"), type: "text" },
    { label: t("template.website"), type: "url" },
    { label: t("template.phone"), type: "phone" },
    { label: t("template.address"), type: "text" },
  ];
}
