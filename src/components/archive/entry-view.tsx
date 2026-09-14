import { FolderPlus, Menu, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DocTree } from "@/components/archive/doc-tree";
import { FieldInput } from "@/components/archive/field-input";
import { KindIcon } from "@/components/archive/kind-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatLastEdited } from "@/lib/notes/format";
import { childrenOf, useArchiveStore } from "@/lib/archive/store";
import { glyphForBook } from "@/lib/archive/types";
import { useI18n } from "@/i18n";

export function EntryView({
  now,
  onOpenSidebar,
  onDeleteEntry,
  onDeleteNode,
}: {
  now: number;
  onOpenSidebar: () => void;
  onDeleteEntry: () => void;
  onDeleteNode: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const books = useArchiveStore((s) => s.books);
  const entries = useArchiveStore((s) => s.entries);
  const docs = useArchiveStore((s) => s.docs);
  const selectedEntryId = useArchiveStore((s) => s.selectedEntryId);
  const selectEntry = useArchiveStore((s) => s.selectEntry);
  const updateEntryTitle = useArchiveStore((s) => s.updateEntryTitle);
  const updateEntryValue = useArchiveStore((s) => s.updateEntryValue);
  const createDoc = useArchiveStore((s) => s.createDoc);
  const createFolder = useArchiveStore((s) => s.createFolder);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const entry = entries.find((item) => item.id === selectedEntryId) ?? null;
  const book = books.find((item) => item.id === entry?.bookId) ?? null;
  if (!entry || !book) return null;

  const roots = childrenOf(docs, entry.id, null);

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
        <KindIcon kind="entry" glyph={glyphForBook(book)} />
        <div className="min-w-0 flex-1">
          <Input
            value={entry.title}
            onChange={(event) => updateEntryTitle(entry.id, event.target.value)}
            placeholder={t("entry.name")}
            aria-label={t("entry.name")}
            className="h-10 border-0 bg-transparent px-0 font-serif text-lg font-semibold shadow-none focus-visible:ring-0 md:text-xl"
          />
          <p className="text-xs text-muted-foreground">
            {book.name}
            <span className="mx-1.5">·</span>
            <span className="tabular-nums" suppressHydrationWarning>
              {formatLastEdited(entry.updatedAt, now, locale)}
            </span>
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onDeleteEntry} aria-label={t("entry.delete")}>
          <Trash2 />
        </Button>
      </header>

      <div className="notes-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-6 md:px-8">
          <section>
            <h3 className="mb-3 font-serif text-base font-semibold">{t("entry.fields")}</h3>
            {book.fields.length === 0 ? (
              <p className="rounded-xl bg-secondary px-4 py-5 text-sm text-muted-foreground">
                {t("entry.noFields")}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {book.fields.map((field) => (
                  <FieldInput
                    key={field.id}
                    field={field}
                    value={entry.values[field.id] ?? ""}
                    books={books}
                    entries={entries}
                    onChange={(value) => updateEntryValue(entry.id, field.id, value)}
                    onOpenRelated={selectEntry}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-serif text-base font-semibold">{t("entry.docs")}</h3>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => createFolder(entry.id, null)}>
                  <FolderPlus />
                  {t("entry.folder")}
                </Button>
                <Button type="button" size="sm" onClick={() => createDoc(entry.id, null)}>
                  <Plus />
                  {t("entry.file")}
                </Button>
              </div>
            </div>
            {roots.length === 0 ? (
              <p className="rounded-xl bg-secondary px-4 py-8 text-center text-sm text-muted-foreground">
                {t("entry.noDocs")}
              </p>
            ) : (
              <div className="rounded-xl border border-hairline bg-card p-2">
                <DocTree
                  entryId={entry.id}
                  parentId={null}
                  now={now}
                  showTime
                  onDelete={onDeleteNode}
                  collapsed={collapsed}
                  toggle={(id) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
