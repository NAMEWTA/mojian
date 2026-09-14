import { Eye, ImagePlus, Menu, PenLine } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { KindIcon } from "@/components/archive/kind-icon";
import { LiveEditor, type LiveEditorHandle } from "@/components/archive/live-editor";
import { MarkdownPreview } from "@/components/notes/markdown-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isImageFile, saveImageFile } from "@/lib/assets";
import { charCount, formatLastEdited } from "@/lib/notes/format";
import { entryTitle, useArchiveStore } from "@/lib/archive/store";
import type { DocLayout } from "@/lib/archive/types";
import { useI18n } from "@/i18n";

export function DocView({
  now,
  onOpenSidebar,
}: {
  now: number;
  onOpenSidebar: () => void;
}) {
  const { t, locale } = useI18n();
  const imageRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<LiveEditorHandle>(null);
  const docs = useArchiveStore((s) => s.docs);
  const entries = useArchiveStore((s) => s.entries);
  const books = useArchiveStore((s) => s.books);
  const selectedDocId = useArchiveStore((s) => s.selectedDocId);
  const docLayout = useArchiveStore((s) => s.docLayout);
  const setDocLayout = useArchiveStore((s) => s.setDocLayout);
  const renameNode = useArchiveStore((s) => s.renameNode);
  const updateDoc = useArchiveStore((s) => s.updateDoc);
  const file = docs.find((item) => item.id === selectedDocId && item.kind === "file");
  const entry = entries.find((item) => item.id === file?.entryId);
  const book = books.find((item) => item.id === entry?.bookId);

  if (!file || !entry || !book) return null;

  const live = docLayout !== "preview";

  async function embedImages(files: File[]) {
    const images = files.filter(isImageFile);
    if (images.length === 0) return;
    const chunks: string[] = [];
    for (const image of images) {
      chunks.push(`![](${await saveImageFile(image)})`);
    }
    liveRef.current?.insertSnippet(chunks.join("\n"));
  }

  function onPickImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length) void embedImages(files);
  }

  const layouts: { id: DocLayout; icon: typeof PenLine; label: string }[] = [
    { id: "live", icon: PenLine, label: t("doc.layoutLive") },
    { id: "preview", icon: Eye, label: t("doc.layoutPreview") },
  ];

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-background">
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
          id="archive-image-input"
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
          onClick={() => {
            liveRef.current?.focus();
            imageRef.current?.click();
          }}
          aria-label={t("doc.insertImage")}
          disabled={!live}
        >
          <ImagePlus />
        </Button>
        <div className="doc-layout-toggle" role="radiogroup" aria-label={t("doc.layout")}>
          {layouts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-label={item.label}
                title={item.label}
                aria-checked={docLayout === item.id}
                aria-pressed={docLayout === item.id}
                onClick={() => setDocLayout(item.id)}
              >
                <Icon />
              </button>
            );
          })}
        </div>
      </header>
      {live ? (
        <LiveEditor
          ref={liveRef}
          docId={file.id}
          content={file.content}
          onChange={(content) => updateDoc(file.id, content)}
          placeholder={t("doc.placeholder")}
          ariaLabel={t("doc.aria")}
        />
      ) : (
        <div className="notes-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8">
          <MarkdownPreview content={file.content} />
        </div>
      )}
      <footer className="flex items-center justify-between border-t border-hairline px-4 py-2 text-xs text-muted-foreground md:px-6">
        <span className="truncate">{file.name}</span>
        <span className="tabular-nums">{t("doc.chars", { n: charCount(file.content) })}</span>
      </footer>
    </section>
  );
}
