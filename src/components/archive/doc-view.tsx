import { Eye, ImagePlus, Menu, Pencil } from "lucide-react";
import { useRef, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { KindIcon } from "@/components/archive/kind-icon";
import { MarkdownPreview } from "@/components/notes/markdown-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isImageFile, saveImageFile } from "@/lib/assets";
import { charCount, formatLastEdited } from "@/lib/notes/format";
import { entryTitle, useArchiveStore } from "@/lib/archive/store";
import { useI18n } from "@/i18n";

export function DocView({
  now,
  onOpenSidebar,
}: {
  now: number;
  onOpenSidebar: () => void;
}) {
  const { t, locale } = useI18n();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
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

  function insertAtCursor(snippet: string) {
    const target = editorRef.current;
    const start = target?.selectionStart ?? active.content.length;
    const end = target?.selectionEnd ?? start;
    const next = `${active.content.slice(0, start)}${snippet}${active.content.slice(end)}`;
    updateDoc(active.id, next);
    window.requestAnimationFrame(() => {
      if (!target) return;
      const pos = start + snippet.length;
      target.selectionStart = target.selectionEnd = pos;
    });
  }

  async function embedImages(files: File[]) {
    const images = files.filter(isImageFile);
    if (images.length === 0) return;
    const chunks: string[] = [];
    for (const image of images) {
      const path = await saveImageFile(image);
      chunks.push(`![](${path})`);
    }
    insertAtCursor(chunks.join("\n"));
  }

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

  function onDrop(event: DragEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.dataTransfer.files);
    if (!files.some(isImageFile)) return;
    event.preventDefault();
    void embedImages(files);
  }

  function onPickImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length) void embedImages(files);
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
          aria-label={t("nav.openTree")}
        >
          <Menu />
        </Button>
        <KindIcon kind="file" />
        <div className="min-w-0 flex-1">
          <Input
            value={file.name}
            onChange={(event) => renameNode(file.id, event.target.value)}
            className="h-10 border-0 bg-transparent px-0 font-serif text-lg font-semibold shadow-none focus-visible:ring-0"
            aria-label={t("doc.name")}
          />
          <p className="text-xs text-muted-foreground">
            {book.name} / {entryTitle(entry)}
            <span className="mx-1.5">·</span>
            <span className="tabular-nums" suppressHydrationWarning>
              {formatLastEdited(file.updatedAt, now, locale)}
            </span>
          </p>
        </div>
        <input
          ref={imageRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          multiple
          className="hidden"
          onChange={onPickImages}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => imageRef.current?.click()}
          aria-label={t("doc.insertImage")}
          disabled={preview}
        >
          <ImagePlus />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setPreview(!preview)}
          aria-label={preview ? t("doc.edit") : t("doc.preview")}
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
            ref={editorRef}
            id="archive-editor"
            value={file.content}
            onChange={(event) => updateDoc(file.id, event.target.value)}
            onKeyDown={onEditorKeyDown}
            onPaste={(event) => {
              const files = Array.from(event.clipboardData.files);
              if (!files.some(isImageFile)) return;
              event.preventDefault();
              void embedImages(files);
            }}
            onDrop={onDrop}
            onDragOver={(event) => {
              if (Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault();
            }}
            placeholder={t("doc.placeholder")}
            spellCheck
            aria-label={t("doc.aria")}
            className="editor-field min-h-96 w-full resize-none bg-transparent font-serif text-lg leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/80"
          />
        )}
      </div>
      <footer className="flex items-center justify-between border-t border-hairline px-4 py-2 text-xs text-muted-foreground md:px-6">
        <span className="truncate">{file.name}</span>
        <span className="tabular-nums">{t("doc.chars", { n: charCount(file.content) })}</span>
      </footer>
    </section>
  );
}
