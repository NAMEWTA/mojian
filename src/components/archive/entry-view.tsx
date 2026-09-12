import { FileText, Folder, FolderPlus, Menu, Plus, Trash2 } from "lucide-react";
import { FieldInput } from "@/components/archive/field-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatLastEdited } from "@/lib/notes/format";
import { childrenOf, entryTitle, nodeTitle, useArchiveStore } from "@/lib/archive/store";

export function EntryView({
  now,
  onOpenSidebar,
  onDeleteEntry,
}: {
  now: number;
  onOpenSidebar: () => void;
  onDeleteEntry: () => void;
}) {
  const books = useArchiveStore((s) => s.books);
  const entries = useArchiveStore((s) => s.entries);
  const docs = useArchiveStore((s) => s.docs);
  const selectedEntryId = useArchiveStore((s) => s.selectedEntryId);
  const selectEntry = useArchiveStore((s) => s.selectEntry);
  const selectNode = useArchiveStore((s) => s.selectNode);
  const updateEntryTitle = useArchiveStore((s) => s.updateEntryTitle);
  const updateEntryValue = useArchiveStore((s) => s.updateEntryValue);
  const createDoc = useArchiveStore((s) => s.createDoc);
  const createFolder = useArchiveStore((s) => s.createFolder);

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
          aria-label="打开目录"
        >
          <Menu />
        </Button>
        <div className="min-w-0 flex-1">
          <Input
            value={entry.title}
            onChange={(event) => updateEntryTitle(entry.id, event.target.value)}
            placeholder="档案名称"
            aria-label="档案名称"
            className="h-10 border-0 bg-transparent px-0 font-serif text-lg font-semibold shadow-none focus-visible:ring-0 md:text-xl"
          />
          <p className="text-xs text-muted-foreground">
            {book.name}
            <span className="mx-1.5">·</span>
            <span className="tabular-nums" suppressHydrationWarning>
              {formatLastEdited(entry.updatedAt, now)}
            </span>
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onDeleteEntry} aria-label="删除档案">
          <Trash2 />
        </Button>
      </header>

      <div className="notes-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-6 md:px-8">
          <section>
            <h3 className="mb-3 font-serif text-base font-semibold">档案属性</h3>
            {book.fields.length === 0 ? (
              <p className="rounded-xl bg-secondary px-4 py-5 text-sm text-muted-foreground">
                这本簿没有结构化字段。点左侧簿名，即可为整本簿添加电话、行业等属性。
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
              <h3 className="font-serif text-base font-semibold">文稿</h3>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => createFolder(entry.id, null)}>
                  <FolderPlus />
                  文件夹
                </Button>
                <Button type="button" size="sm" onClick={() => createDoc(entry.id, null)}>
                  <Plus />
                  文档
                </Button>
              </div>
            </div>
            {roots.length === 0 ? (
              <p className="rounded-xl bg-secondary px-4 py-8 text-center text-sm text-muted-foreground">
                还没有文稿。档案像文件夹，可以在里面放 Markdown 和子文件夹。
              </p>
            ) : (
              <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-card">
                {roots.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50"
                      onClick={() => selectNode(child.id)}
                    >
                      {child.kind === "folder" ? (
                        <Folder className="size-4 text-primary" />
                      ) : (
                        <FileText className="size-4 text-muted-foreground" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {nodeTitle(child)}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatLastEdited(child.updatedAt, now)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
