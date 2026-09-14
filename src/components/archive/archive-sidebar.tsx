import { ChevronDown, FolderPlus, Plus, Search, X } from "lucide-react";
import { useMemo, useState, type ReactNode, type RefObject } from "react";
import { DocTree } from "@/components/archive/doc-tree";
import { KindIcon } from "@/components/archive/kind-icon";
import { HighlightText } from "@/components/notes/highlight-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  childrenOf,
  entryMatches,
  entryTitle,
  useArchiveStore,
} from "@/lib/archive/store";
import type { Entry } from "@/lib/archive/types";
import { glyphForBook } from "@/lib/archive/types";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

function Row({
  selected,
  onClick,
  icon,
  label,
  query,
  accessory,
  chevron,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  query: string;
  accessory?: ReactNode;
  chevron?: { open: boolean; onToggle: () => void } | null;
}) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "group flex items-center gap-0.5 rounded-lg pr-1",
        selected ? "bg-card shadow-border" : "hover:bg-accent/70",
      )}
    >
      {chevron ? (
        <button
          type="button"
          className="flex size-7 shrink-0 items-center justify-center text-muted-foreground"
          aria-label={chevron.open ? t("nav.collapse") : t("nav.expand")}
          onClick={(event) => {
            event.stopPropagation();
            chevron.onToggle();
          }}
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform duration-150", !chevron.open && "-rotate-90")}
          />
        </button>
      ) : (
        <span className="size-7 shrink-0" />
      )}
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-sm"
        onClick={onClick}
      >
        {icon}
        <span className="truncate">
          <HighlightText text={label} query={query} />
        </span>
      </button>
      <div className="flex shrink-0 opacity-0 group-hover:opacity-100">{accessory}</div>
    </div>
  );
}

function EntryBranch({
  entry,
  bookId,
  query,
  onClose,
  collapsed,
  toggle,
  onDeleteNode,
}: {
  entry: Entry;
  bookId: string;
  query: string;
  onClose: () => void;
  collapsed: Record<string, boolean>;
  toggle: (id: string) => void;
  onDeleteNode: (id: string) => void;
}) {
  const docs = useArchiveStore((s) => s.docs);
  const books = useArchiveStore((s) => s.books);
  const selectedEntryId = useArchiveStore((s) => s.selectedEntryId);
  const selectedDocId = useArchiveStore((s) => s.selectedDocId);
  const selectEntry = useArchiveStore((s) => s.selectEntry);
  const createDoc = useArchiveStore((s) => s.createDoc);
  const createFolder = useArchiveStore((s) => s.createFolder);
  const roots = childrenOf(docs, entry.id, null);
  const book = books.find((item) => item.id === bookId);
  const open = !collapsed[entry.id];
  const selected = entry.id === selectedEntryId && !selectedDocId;
  const { t } = useI18n();

  return (
    <li>
      <Row
        selected={selected}
        onClick={() => {
          selectEntry(entry.id);
          onClose();
        }}
        icon={<KindIcon kind="entry" glyph={glyphForBook(book ?? { id: bookId })} />}
        label={entryTitle(entry)}
        query={query}
        chevron={{ open, onToggle: () => toggle(entry.id) }}
        accessory={
          <>
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label={t("nav.newDoc")}
              onClick={() => createDoc(entry.id, null)}
            >
              <Plus className="size-3" />
            </button>
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label={t("nav.newFolder")}
              onClick={() => createFolder(entry.id, null)}
            >
              <FolderPlus className="size-3" />
            </button>
          </>
        }
      />
      {open && roots.length > 0 ? (
        <div className="ml-3 border-l border-hairline pl-1">
          <DocTree
            entryId={entry.id}
            parentId={null}
            query={query}
            onOpen={onClose}
            onDelete={onDeleteNode}
            collapsed={collapsed}
            toggle={toggle}
          />
        </div>
      ) : null}
    </li>
  );
}

export function ArchiveSidebar({
  searchRef,
  onClose,
  onCreateBook,
  onCreateEntry,
  onDeleteNode,
}: {
  searchRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onCreateBook: () => void;
  onCreateEntry: (bookId: string) => void;
  onDeleteNode: (id: string) => void;
}) {
  const { t } = useI18n();
  const books = useArchiveStore((s) => s.books);
  const entries = useArchiveStore((s) => s.entries);
  const docs = useArchiveStore((s) => s.docs);
  const search = useArchiveStore((s) => s.search);
  const selectedBookId = useArchiveStore((s) => s.selectedBookId);
  const selectedEntryId = useArchiveStore((s) => s.selectedEntryId);
  const selectedDocId = useArchiveStore((s) => s.selectedDocId);
  const setSearch = useArchiveStore((s) => s.setSearch);
  const selectBook = useArchiveStore((s) => s.selectBook);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const visible = useMemo(() => {
    return books.map((book) => ({
      book,
      entries: entries
        .filter((entry) => entry.bookId === book.id)
        .filter((entry) => entryMatches(entry, docs, search))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    }));
  }, [books, entries, docs, search]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-xl font-semibold tracking-tight">{t("app.name")}</h1>
          <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onClose}
          aria-label={t("nav.closeTree")}
        >
          <X />
        </Button>
      </div>

      <div className="px-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("nav.search")}
            aria-label={t("nav.searchAria")}
            autoComplete="off"
            className="h-11 rounded-xl bg-card pl-9"
          />
        </div>
      </div>

      <div className="notes-scroll mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {visible.map(({ book, entries: list }) => {
          const open = !collapsed[book.id] || Boolean(search.trim());
          const selected = book.id === selectedBookId && !selectedEntryId && !selectedDocId;
          return (
            <section key={book.id} className="mb-1">
              <Row
                selected={selected}
                onClick={() => {
                  selectBook(book.id);
                  onClose();
                }}
                icon={<KindIcon kind="book" glyph={glyphForBook(book)} />}
                label={book.name}
                query={search}
                chevron={{ open, onToggle: () => toggle(book.id) }}
                accessory={
                  <button
                    type="button"
                    className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                    aria-label={t("nav.newEntry")}
                    onClick={() => onCreateEntry(book.id)}
                  >
                    <Plus className="size-3" />
                  </button>
                }
              />
              {open ? (
                <ul className="ml-3 border-l border-hairline pl-1">
                  {list.length === 0 ? (
                    <li className="px-3 py-2 text-xs text-muted-foreground">
                      {search.trim() ? t("nav.noMatch") : t("nav.noEntries")}
                    </li>
                  ) : (
                    list.map((entry) => (
                      <EntryBranch
                        key={entry.id}
                        entry={entry}
                        bookId={book.id}
                        query={search}
                        onClose={onClose}
                        collapsed={collapsed}
                        toggle={toggle}
                        onDeleteNode={onDeleteNode}
                      />
                    ))
                  )}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>

      <div className="border-t border-hairline p-3">
        <Button type="button" className="h-11 w-full rounded-xl" onClick={onCreateBook}>
          <Plus />
          {t("nav.newBook")}
        </Button>
      </div>
    </div>
  );
}
