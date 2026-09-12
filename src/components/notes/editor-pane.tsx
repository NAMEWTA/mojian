import { Eye, Menu, Pencil, Plus, Trash2 } from "lucide-react";
import type { KeyboardEvent, RefObject } from "react";
import { MarkdownPreview } from "@/components/notes/markdown-preview";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { charCount, formatLastEdited, noteTitle } from "@/lib/notes/format";
import { useNotesStore } from "@/lib/notes/store";
import { cn, useModSymbol } from "@/lib/utils";

export function EditorPane({
  editorRef,
  now,
  onOpenSidebar,
  onRequestDelete,
  onCreate,
}: {
  editorRef: RefObject<HTMLTextAreaElement | null>;
  now: number;
  onOpenSidebar: () => void;
  onRequestDelete: () => void;
  onCreate: () => void;
}) {
  const notes = useNotesStore((s) => s.notes);
  const selectedId = useNotesStore((s) => s.selectedId);
  const preview = useNotesStore((s) => s.preview);
  const setPreview = useNotesStore((s) => s.setPreview);
  const updateNote = useNotesStore((s) => s.updateNote);
  const note = notes.find((item) => item.id === selectedId) ?? null;
  const mod = useModSymbol();

  if (!note) {
    return (
      <section className="flex min-h-0 flex-1 flex-col bg-background">
        <header className="flex h-14 items-center gap-2 border-b border-hairline px-3 md:h-16 md:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenSidebar}
            aria-label="打开目录"
          >
            <Menu />
          </Button>
          <span className="font-serif text-lg">墨笺</span>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="font-serif text-2xl tracking-tight text-balance">
            从一张空白的纸开始
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            新建一则笔记，第一行会成为标题。内容只保存在这台设备上。
          </p>
          <Button type="button" className="mt-6 h-11 rounded-xl px-5" onClick={onCreate}>
            <Plus />
            新建笔记
          </Button>
        </div>
      </section>
    );
  }

  const active = note;

  function onEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const next = `${active.content.slice(0, start)}  ${active.content.slice(end)}`;
    updateNote(active.id, next);
    window.requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = start + 2;
    });
  }

  const title = noteTitle(active.content);
  const count = charCount(active.content);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex items-center gap-2 border-b border-hairline px-3 py-2 md:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenSidebar}
          aria-label="打开目录"
        >
          <Menu />
        </Button>
        <div className="min-w-0 flex-1 py-1">
          <h2 className="truncate font-serif text-lg font-semibold tracking-tight md:text-xl">
            {title}
          </h2>
          <p className="text-xs tabular-nums text-muted-foreground" suppressHydrationWarning>
            最后编辑 {formatLastEdited(active.updatedAt, now)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setPreview(!preview)}
            aria-label={preview ? "返回编辑" : "预览 Markdown"}
            aria-pressed={preview}
          >
            {preview ? <Pencil /> : <Eye />}
          </Button>
          <div className="hidden rounded-full bg-secondary p-1 md:flex">
            <button
              type="button"
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors duration-150",
                !preview
                  ? "bg-card text-foreground shadow-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setPreview(false)}
              aria-pressed={!preview}
            >
              编辑
            </button>
            <button
              type="button"
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors duration-150",
                preview
                  ? "bg-card text-foreground shadow-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setPreview(true)}
              aria-pressed={preview}
            >
              {preview ? <Eye className="size-3.5" /> : null}
              预览
            </button>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRequestDelete}
                aria-label="删除笔记"
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除 {mod} Shift ⌫</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <div className="notes-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-2xl px-5 py-8 md:px-8 md:py-10">
          {preview ? (
            <MarkdownPreview content={active.content} />
          ) : (
            <textarea
              id="note-editor"
              ref={editorRef}
              value={active.content}
              onChange={(event) => updateNote(active.id, event.target.value)}
              onKeyDown={onEditorKeyDown}
              placeholder="开始书写，第一行会成为标题。"
              spellCheck
              aria-label="笔记正文"
              className="editor-field min-h-96 w-full flex-1 resize-none bg-transparent font-serif text-lg leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/80"
            />
          )}
        </div>
      </div>

      <footer className="flex items-center justify-between border-t border-hairline px-4 py-2 text-xs text-muted-foreground md:px-6">
        <span className="tabular-nums">{count} 字</span>
        <span className="hidden sm:inline">按 ? 查看快捷键 · 已自动保存</span>
        <span className="sm:hidden">已自动保存</span>
      </footer>
    </section>
  );
}
