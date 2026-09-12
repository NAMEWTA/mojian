import {
  BookMarked,
  Building2,
  ChevronDown,
  FileText,
  Folder,
  FolderPlus,
  PenLine,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState, type ReactNode, type RefObject } from "react";
import { HighlightText } from "@/components/notes/highlight-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOOK_COMPANY, BOOK_NOTES, BOOK_PEOPLE } from "@/lib/archive/seed";
import {
  childrenOf,
  entryMatches,
  entryTitle,
  nodeTitle,
  useArchiveStore,
} from "@/lib/archive/store";
import type { ArchiveNode, Entry } from "@/lib/archive/types";
import { cn } from "@/lib/utils";

function bookIcon(bookId: string) {
  if (bookId === BOOK_COMPANY) return Building2;
  if (bookId === BOOK_PEOPLE) return Users;
  if (bookId === BOOK_NOTES) return PenLine;
  return BookMarked;
}

function Row({
  selected,
  onClick,
  icon,
  label,
  query,
  accessory,
  chevron,
  expanded,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  query: string;
  accessory?: ReactNode;
  chevron?: { open: boolean; onToggle: () => void } | null;
  expanded?: boolean;
}) {
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
          aria-label={chevron.open ? "收起" : "展开"}
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
      <div className={cn("flex shrink-0", expanded ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
        {accessory}
      </div>
    </div>
  );
}

function NodeBranch({
  node,
  entryId,
  query,
  onClose,
  collapsed,
  toggle,
  onDelete,
}: {
  node: ArchiveNode;
  entryId: string;
  query: string;
  onClose: () => void;
  collapsed: Record<string, boolean>;
  toggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const docs = useArchiveStore((s) => s.docs);
  const selectedDocId = useArchiveStore((s) => s.selectedDocId);
  const selectNode = useArchiveStore((s) => s.selectNode);
  const createDoc = useArchiveStore((s) => s.createDoc);
  const createFolder = useArchiveStore((s) => s.createFolder);
  const kids = node.kind === "folder" ? childrenOf(docs, entryId, node.id) : [];
  const open = !collapsed[node.id];

  return (
    <li>
      <Row
        selected={node.id === selectedDocId}
        onClick={() => {
          selectNode(node.id);
          onClose();
        }}
        icon={
          node.kind === "folder" ? (
            <Folder className="size-3.5 shrink-0 text-primary" />
          ) : (
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          )
        }
        label={nodeTitle(node)}
        query={query}
        chevron={
          node.kind === "folder"
            ? { open, onToggle: () => toggle(node.id) }
            : null
        }
        accessory={
          node.kind === "folder" ? (
            <>
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                aria-label="在此新建文档"
                onClick={() => createDoc(entryId, node.id)}
              >
                <Plus className="size-3" />
              </button>
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                aria-label="在此新建文件夹"
                onClick={() => createFolder(entryId, node.id)}
              >
                <FolderPlus className="size-3" />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
              aria-label="删除文档"
              onClick={() => onDelete(node.id)}
            >
              <X className="size-3" />
            </button>
          )
        }
      />
      {node.kind === "folder" && open ? (
        <ul className="ml-3 border-l border-hairline pl-1">
          {kids.map((child) => (
            <NodeBranch
              key={child.id}
              node={child}
              entryId={entryId}
              query={query}
              onClose={onClose}
              collapsed={collapsed}
              toggle={toggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function EntryBranch({
  entry,
  query,
  onClose,
  collapsed,
  toggle,
  onDeleteNode,
}: {
  entry: Entry;
  query: string;
  onClose: () => void;
  collapsed: Record<string, boolean>;
  toggle: (id: string) => void;
  onDeleteNode: (id: string) => void;
}) {
  const docs = useArchiveStore((s) => s.docs);
  const selectedEntryId = useArchiveStore((s) => s.selectedEntryId);
  const selectedDocId = useArchiveStore((s) => s.selectedDocId);
  const selectEntry = useArchiveStore((s) => s.selectEntry);
  const createDoc = useArchiveStore((s) => s.createDoc);
  const createFolder = useArchiveStore((s) => s.createFolder);
  const roots = childrenOf(docs, entry.id, null);
  const open = !collapsed[entry.id];
  const selected = entry.id === selectedEntryId && !selectedDocId;

  return (
    <li>
      <Row
        selected={selected}
        onClick={() => {
          selectEntry(entry.id);
          onClose();
        }}
        icon={<FileText className="size-3.5 shrink-0 text-primary" />}
        label={entryTitle(entry)}
        query={query}
        chevron={{ open, onToggle: () => toggle(entry.id) }}
        accessory={
          <>
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label="新建文档"
              onClick={() => createDoc(entry.id, null)}
            >
              <Plus className="size-3" />
            </button>
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label="新建文件夹"
              onClick={() => createFolder(entry.id, null)}
            >
              <FolderPlus className="size-3" />
            </button>
          </>
        }
      />
      {open ? (
        <ul className="ml-3 border-l border-hairline pl-1">
          {roots.map((node) => (
            <NodeBranch
              key={node.id}
              node={node}
              entryId={entry.id}
              query={query}
              onClose={onClose}
              collapsed={collapsed}
              toggle={toggle}
              onDelete={onDeleteNode}
            />
          ))}
        </ul>
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
          <h1 className="font-serif text-xl font-semibold tracking-tight">墨笺</h1>
          <p className="text-xs text-muted-foreground">簿 · 档案 · 文稿</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onClose}
          aria-label="关闭目录"
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
            placeholder="搜索档案与文稿"
            aria-label="搜索档案"
            autoComplete="off"
            className="h-11 rounded-xl bg-card pl-9"
          />
        </div>
      </div>

      <div className="notes-scroll mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {visible.map(({ book, entries: list }) => {
          const Icon = bookIcon(book.id);
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
                icon={<Icon className="size-3.5 shrink-0 text-primary" />}
                label={book.name}
                query={search}
                chevron={{ open, onToggle: () => toggle(book.id) }}
                accessory={
                  <button
                    type="button"
                    className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                    aria-label="新建档案"
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
                      {search.trim() ? "没有匹配" : "还没有档案"}
                    </li>
                  ) : (
                    list.map((entry) => (
                      <EntryBranch
                        key={entry.id}
                        entry={entry}
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
          新建簿
        </Button>
      </div>
    </div>
  );
}
