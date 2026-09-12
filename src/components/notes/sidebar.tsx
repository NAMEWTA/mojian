import { Pencil, Plus, Search, X } from "lucide-react";
import type { KeyboardEvent, RefObject } from "react";
import { HighlightText } from "@/components/notes/highlight-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterNotes,
  formatLastEdited,
  noteExcerpt,
  noteTitle,
  sortNotes,
} from "@/lib/notes/format";
import { useNotesStore } from "@/lib/notes/store";
import { cn } from "@/lib/utils";

export function Sidebar({
  searchRef,
  now,
  onClose,
  onCreate,
}: {
  searchRef: RefObject<HTMLInputElement | null>;
  now: number;
  onClose: () => void;
  onCreate: () => void;
}) {
  const notes = useNotesStore((s) => s.notes);
  const selectedId = useNotesStore((s) => s.selectedId);
  const search = useNotesStore((s) => s.search);
  const setSearch = useNotesStore((s) => s.setSearch);
  const selectNote = useNotesStore((s) => s.selectNote);
  const selectOffset = useNotesStore((s) => s.selectOffset);

  const visible = filterNotes(sortNotes(notes), search);

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectOffset(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectOffset(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      onClose();
      window.requestAnimationFrame(() => {
        document.getElementById("note-editor")?.focus();
      });
    } else if (event.key === "Escape") {
      if (search) {
        event.preventDefault();
        setSearch("");
      } else {
        onClose();
        searchRef.current?.blur();
      }
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-xl font-semibold tracking-tight">笔记</h1>
          <p className="text-xs text-muted-foreground">安静地写</p>
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
            onKeyDown={onSearchKeyDown}
            placeholder="搜索笔记"
            aria-label="搜索笔记"
            autoComplete="off"
            className="h-11 rounded-xl bg-card pl-9 pr-9"
          />
          {search ? (
            <button
              type="button"
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label="清除搜索"
              onClick={() => setSearch("")}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          className="mt-3 h-11 w-full rounded-xl"
          onClick={onCreate}
        >
          <Plus />
          新建笔记
        </Button>
      </div>

      <div
        role="listbox"
        aria-label="笔记列表"
        className="notes-scroll mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-4"
      >
        {visible.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <Pencil className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              {notes.length === 0 ? "还没有笔记" : "没有匹配的笔记"}
            </p>
          </div>
        ) : (
          visible.map((note) => {
            const selected = note.id === selectedId;
            const title = noteTitle(note.content);
            const excerpt = noteExcerpt(note.content);
            return (
              <button
                key={note.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  selectNote(note.id);
                  onClose();
                }}
                className={cn(
                  "mb-1 w-full rounded-xl px-3 py-3 text-left transition-colors duration-150 ease-out",
                  selected
                    ? "bg-card text-foreground shadow-border"
                    : "text-sidebar-foreground hover:bg-accent/70",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate font-medium">
                    <HighlightText text={title} query={search} />
                  </span>
                  <time
                    dateTime={new Date(note.updatedAt).toISOString()}
                    suppressHydrationWarning
                    className="shrink-0 font-sans text-xs tabular-nums text-muted-foreground"
                  >
                    {formatLastEdited(note.updatedAt, now)}
                  </time>
                </div>
                {excerpt ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    <HighlightText text={excerpt} query={search} />
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">空白笔记</p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
