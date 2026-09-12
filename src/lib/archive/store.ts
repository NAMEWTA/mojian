import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { noteTitle } from "@/lib/notes/format";
import { BOOK_NOTES, SEED_BOOKS, SEED_DOCS, SEED_ENTRIES } from "./seed";
import type { ArchiveNode, Book, Entry, FieldDef, FocusKind } from "./types";

function nid(): string {
  return crypto.randomUUID();
}

function touch(): number {
  return Date.now();
}

function resolveParent(docs: ArchiveNode[], parentId?: string | null): string | null {
  if (!parentId) return null;
  const node = docs.find((item) => item.id === parentId);
  if (!node) return null;
  return node.kind === "folder" ? node.id : node.parentId;
}

export function migrateNode(raw: Partial<ArchiveNode> & { content?: string }): ArchiveNode {
  const content = raw.content ?? "";
  const kind = raw.kind === "folder" || raw.kind === "file" ? raw.kind : "file";
  const fromContent = noteTitle(content);
  return {
    id: raw.id ?? nid(),
    entryId: raw.entryId ?? "",
    parentId: raw.parentId ?? null,
    kind,
    name: raw.name?.trim()
      ? raw.name
      : kind === "folder"
        ? "未命名文件夹"
        : fromContent === "无标题"
          ? "未命名文档"
          : fromContent,
    content,
    createdAt: raw.createdAt ?? touch(),
    updatedAt: raw.updatedAt ?? touch(),
  };
}

type ArchiveState = {
  books: Book[];
  entries: Entry[];
  docs: ArchiveNode[];
  selectedBookId: string | null;
  selectedEntryId: string | null;
  selectedDocId: string | null;
  search: string;
  preview: boolean;
  selectBook: (id: string | null) => void;
  selectEntry: (id: string | null) => void;
  selectDoc: (id: string | null) => void;
  selectNode: (id: string) => void;
  setSearch: (search: string) => void;
  setPreview: (preview: boolean) => void;
  createBook: (name: string, fields?: FieldDef[]) => string;
  renameBook: (id: string, name: string) => void;
  deleteBook: (id: string) => void;
  setFields: (bookId: string, fields: FieldDef[]) => void;
  createEntry: (bookId: string) => string;
  updateEntryTitle: (id: string, title: string) => void;
  updateEntryValue: (id: string, fieldId: string, value: string) => void;
  deleteEntry: (id: string) => void;
  createDoc: (entryId: string, parentId?: string | null) => string;
  createFolder: (entryId: string, parentId?: string | null) => string;
  renameNode: (id: string, name: string) => void;
  updateDoc: (id: string, content: string) => void;
  deleteNode: (id: string) => void;
};

function firstFileId(docs: ArchiveNode[], entryId: string | null): string | null {
  if (!entryId) return null;
  const list = docs
    .filter((doc) => doc.entryId === entryId && doc.kind === "file")
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return list[0]?.id ?? null;
}

function descendantIds(docs: ArchiveNode[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const node of docs) {
      if (node.parentId && ids.has(node.parentId) && !ids.has(node.id)) {
        ids.add(node.id);
        added = true;
      }
    }
  }
  return ids;
}

export function entryTitle(entry: Entry): string {
  return entry.title.trim() || "未命名";
}

export function nodeTitle(node: ArchiveNode): string {
  if (node.kind === "folder") return node.name.trim() || "未命名文件夹";
  if (node.name.trim()) return node.name.trim();
  const fromContent = noteTitle(node.content);
  return fromContent === "无标题" ? "未命名文档" : fromContent;
}

export function docTitle(node: ArchiveNode): string {
  return nodeTitle(node);
}

export function childrenOf(
  docs: ArchiveNode[],
  entryId: string,
  parentId: string | null,
): ArchiveNode[] {
  return docs
    .filter((node) => node.entryId === entryId && node.parentId === parentId)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
      return nodeTitle(a).localeCompare(nodeTitle(b), "zh");
    });
}

export function getFocus(state: {
  selectedBookId: string | null;
  selectedEntryId: string | null;
  selectedDocId: string | null;
  docs: ArchiveNode[];
}): FocusKind {
  if (state.selectedDocId) {
    const node = state.docs.find((item) => item.id === state.selectedDocId);
    if (node?.kind === "file") return "file";
    if (node?.kind === "folder") return "folder";
  }
  if (state.selectedEntryId) return "entry";
  return "book";
}

export function entryMatches(
  entry: Entry,
  docs: ArchiveNode[],
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (entryTitle(entry).toLowerCase().includes(q)) return true;
  if (Object.values(entry.values).some((value) => value.toLowerCase().includes(q))) {
    return true;
  }
  return docs.some(
    (doc) =>
      doc.entryId === entry.id &&
      (nodeTitle(doc).toLowerCase().includes(q) || doc.content.toLowerCase().includes(q)),
  );
}

export const useArchiveStore = create<ArchiveState>()(
  persist(
    (set, get) => ({
      books: SEED_BOOKS,
      entries: SEED_ENTRIES,
      docs: SEED_DOCS,
      selectedBookId: BOOK_NOTES,
      selectedEntryId: null,
      selectedDocId: null,
      search: "",
      preview: false,

      selectBook: (id) => {
        set({
          selectedBookId: id,
          selectedEntryId: null,
          selectedDocId: null,
        });
      },

      selectEntry: (id) => {
        const { entries } = get();
        const entry = entries.find((item) => item.id === id) ?? null;
        set({
          selectedEntryId: id,
          selectedBookId: entry?.bookId ?? get().selectedBookId,
          selectedDocId: null,
        });
      },

      selectDoc: (id) => set({ selectedDocId: id, preview: false }),

      selectNode: (id) => {
        const { docs, entries } = get();
        const node = docs.find((item) => item.id === id);
        if (!node) {
          set({ selectedDocId: null });
          return;
        }
        const entry = entries.find((item) => item.id === node.entryId);
        set({
          selectedDocId: id,
          selectedEntryId: node.entryId,
          selectedBookId: entry?.bookId ?? get().selectedBookId,
          preview: false,
        });
      },

      setSearch: (search) => set({ search }),
      setPreview: (preview) => set({ preview }),

      createBook: (name, fields = []) => {
        const id = nid();
        const now = touch();
        const book: Book = {
          id,
          name: name.trim() || "未命名簿",
          fields: fields.map((field) => ({ ...field, id: field.id || nid() })),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          books: [...state.books, book],
          selectedBookId: id,
          selectedEntryId: null,
          selectedDocId: null,
        }));
        return id;
      },

      renameBook: (id, name) => {
        const now = touch();
        set((state) => ({
          books: state.books.map((book) =>
            book.id === id ? { ...book, name: name.trim() || book.name, updatedAt: now } : book,
          ),
        }));
      },

      deleteBook: (id) => {
        set((state) => {
          const remainingBooks = state.books.filter((book) => book.id !== id);
          const remainingEntries = state.entries.filter((entry) => entry.bookId !== id);
          const remainingIds = new Set(remainingEntries.map((entry) => entry.id));
          const remainingDocs = state.docs.filter((doc) => remainingIds.has(doc.entryId));
          const nextBook = remainingBooks[0] ?? null;
          return {
            books: remainingBooks,
            entries: remainingEntries,
            docs: remainingDocs,
            selectedBookId: nextBook?.id ?? null,
            selectedEntryId: null,
            selectedDocId: null,
          };
        });
      },

      setFields: (bookId, fields) => {
        const now = touch();
        set((state) => ({
          books: state.books.map((book) =>
            book.id === bookId ? { ...book, fields, updatedAt: now } : book,
          ),
        }));
      },

      createEntry: (bookId) => {
        const id = nid();
        const now = touch();
        const entry: Entry = {
          id,
          bookId,
          title: "",
          values: {},
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          entries: [entry, ...state.entries],
          selectedBookId: bookId,
          selectedEntryId: id,
          selectedDocId: null,
          preview: false,
        }));
        return id;
      },

      updateEntryTitle: (id, title) => {
        const now = touch();
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, title, updatedAt: now } : entry,
          ),
        }));
      },

      updateEntryValue: (id, fieldId, value) => {
        const now = touch();
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  updatedAt: now,
                  values: { ...entry.values, [fieldId]: value },
                }
              : entry,
          ),
        }));
      },

      deleteEntry: (id) => {
        set((state) => {
          const remaining = state.entries.filter((entry) => entry.id !== id);
          const docs = state.docs.filter((doc) => doc.entryId !== id);
          let selectedEntryId = state.selectedEntryId;
          if (state.selectedEntryId === id) {
            const sameBook = remaining.filter(
              (entry) => entry.bookId === state.selectedBookId,
            );
            selectedEntryId = sameBook[0]?.id ?? null;
          }
          return {
            entries: remaining,
            docs,
            selectedEntryId,
            selectedDocId: firstFileId(docs, selectedEntryId),
          };
        });
      },

      createDoc: (entryId, parentId = null) => {
        const id = nid();
        const now = touch();
        const doc: ArchiveNode = {
          id,
          entryId,
          parentId: resolveParent(get().docs, parentId),
          kind: "file",
          name: "未命名文档",
          content: "",
          createdAt: now,
          updatedAt: now,
        };
        const entry = get().entries.find((item) => item.id === entryId);
        set((state) => ({
          docs: [doc, ...state.docs],
          selectedDocId: id,
          selectedEntryId: entryId,
          selectedBookId: entry?.bookId ?? state.selectedBookId,
          preview: false,
          entries: state.entries.map((item) =>
            item.id === entryId ? { ...item, updatedAt: now } : item,
          ),
        }));
        return id;
      },

      createFolder: (entryId, parentId = null) => {
        const id = nid();
        const now = touch();
        const node: ArchiveNode = {
          id,
          entryId,
          parentId: resolveParent(get().docs, parentId),
          kind: "folder",
          name: "未命名文件夹",
          content: "",
          createdAt: now,
          updatedAt: now,
        };
        const entry = get().entries.find((item) => item.id === entryId);
        set((state) => ({
          docs: [node, ...state.docs],
          selectedDocId: id,
          selectedEntryId: entryId,
          selectedBookId: entry?.bookId ?? state.selectedBookId,
          entries: state.entries.map((item) =>
            item.id === entryId ? { ...item, updatedAt: now } : item,
          ),
        }));
        return id;
      },

      renameNode: (id, name) => {
        const now = touch();
        set((state) => ({
          docs: state.docs.map((doc) =>
            doc.id === id ? { ...doc, name: name.trim() || doc.name, updatedAt: now } : doc,
          ),
        }));
      },

      updateDoc: (id, content) => {
        const now = touch();
        set((state) => {
          const current = state.docs.find((doc) => doc.id === id);
          return {
            docs: state.docs.map((doc) =>
              doc.id === id ? { ...doc, content, updatedAt: now } : doc,
            ),
            entries: current
              ? state.entries.map((entry) =>
                  entry.id === current.entryId ? { ...entry, updatedAt: now } : entry,
                )
              : state.entries,
          };
        });
      },

      deleteNode: (id) => {
        set((state) => {
          const drop = descendantIds(state.docs, id);
          const remaining = state.docs.filter((doc) => !drop.has(doc.id));
          const selectedDocId = drop.has(state.selectedDocId ?? "")
            ? firstFileId(remaining, state.selectedEntryId)
            : state.selectedDocId;
          return { docs: remaining, selectedDocId };
        });
      },
    }),
    {
      name: "mojian-archive",
      version: 3,
      storage:
        typeof window === "undefined"
          ? undefined
          : createJSONStorage(() => localStorage),
      skipHydration: true,
      migrate: (persisted, version) => {
        const state = persisted as {
          docs?: unknown[];
          books?: Book[];
          entries?: Entry[];
        };
        if (version < 2 && Array.isArray(state.docs)) {
          state.docs = state.docs.map((item) =>
            migrateNode(item as Partial<ArchiveNode>),
          );
        }
        if (version < 3) {
          const books = state.books ?? [];
          if (!books.some((book) => book.id === BOOK_NOTES)) {
            const noteBook = SEED_BOOKS.find((book) => book.id === BOOK_NOTES);
            const noteEntries = SEED_ENTRIES.filter((entry) => entry.bookId === BOOK_NOTES);
            const noteDocs = SEED_DOCS.filter((doc) =>
              noteEntries.some((entry) => entry.id === doc.entryId),
            );
            if (noteBook) state.books = [noteBook, ...books];
            state.entries = [...noteEntries, ...(state.entries ?? [])];
            state.docs = [...noteDocs, ...((state.docs as ArchiveNode[] | undefined) ?? [])];
          }
        }
        return state as ArchiveState;
      },
      partialize: (state) => ({
        books: state.books,
        entries: state.entries,
        docs: state.docs,
        selectedBookId: state.selectedBookId,
        selectedEntryId: state.selectedEntryId,
        selectedDocId: state.selectedDocId,
        preview: state.preview,
      }),
    },
  ),
);
