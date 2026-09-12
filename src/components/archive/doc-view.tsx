import { Eye, Menu, Pencil } from "lucide-react";
import type { KeyboardEvent } from "react";
import { MarkdownPreview } from "@/components/notes/markdown-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { charCount, formatLastEdited } from "@/lib/notes/format";
import { entryTitle, useArchiveStore } from "@/lib/archive/store";

export function DocView({
  now,
  onOpenSidebar,
}: {
  now: number;
  onOpenSidebar: () => void;
}) {
  const docs = useArchiveStore((s) => s.docs);
  const entries = useArchiveStore((s) => s.entries);
  const books = useArchiveStore((s) => s.books);
  const selectedDocId = useArchiveStore((s) => s.selectedDocId);
  const preview = useArchiveStore((s) => s.preview);
  const setPreview = useArchiveStore((s) => s.setPreview);
  const renameNode = useArchiveStore((s) => s.renameNode);
  const updateDoc = useArchiveStore((s) => s.updateDoc);
  const file = docs.find((item) => item.id === selectedDocId && item.kind === "file");
  const entry = entries.find((item) => item.id === file?.entryId);
  const book = books.find((item) => item.id === entry?.bookId);

  if (!file || !entry || !book) return null;
  const active = file;

  function onEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const next = `${active.content.slice(0, start)}  ${active.content.slice(end)}`;
    updateDoc(active.id, next);
    window.requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = start + 2;
    });
  }

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
        <div className="min-w-0 flex-1">
          <Input
            value={file.name}
            onChange={(event) => renameNode(file.id, event.target.value)}
            className="h-10 border-0 bg-transparent px-0 font-serif text-lg font-semibold shadow-none focus-visible:ring-0"
            aria-label="文档名称"
          />
          <p className="text-xs text-muted-foreground">
            {book.name} / {entryTitle(entry)}
            <span className="mx-1.5">·</span>
            <span className="tabular-nums" suppressHydrationWarning>
              {formatLastEdited(file.updatedAt, now)}
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setPreview(!preview)}
          aria-label={preview ? "返回编辑" : "预览 Markdown"}
          aria-pressed={preview}
        >
          {preview ? <Pencil /> : <Eye />}
        </Button>
      </header>
      <div className="notes-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-10">
        {preview ? (
          <MarkdownPreview content={file.content} />
        ) : (
          <textarea
            id="archive-editor"
            value={file.content}
            onChange={(event) => updateDoc(file.id, event.target.value)}
            onKeyDown={onEditorKeyDown}
            placeholder="开始书写。"
            spellCheck
            aria-label="档案文档"
            className="editor-field min-h-96 w-full resize-none bg-transparent font-serif text-lg leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/80"
          />
        )}
      </div>
      <footer className="flex items-center justify-between border-t border-hairline px-4 py-2 text-xs text-muted-foreground md:px-6">
        <span className="truncate">{file.name}</span>
        <span className="tabular-nums">{charCount(file.content)} 字</span>
      </footer>
    </section>
  );
}
