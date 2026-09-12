import { FileText, Folder, FolderPlus, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatLastEdited } from "@/lib/notes/format";
import { childrenOf, nodeTitle, useArchiveStore } from "@/lib/archive/store";

export function FolderView({
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
  const selectNode = useArchiveStore((s) => s.selectNode);
  const renameNode = useArchiveStore((s) => s.renameNode);
  const createDoc = useArchiveStore((s) => s.createDoc);
  const createFolder = useArchiveStore((s) => s.createFolder);
  const folder = docs.find((item) => item.id === selectedDocId && item.kind === "folder");
  const entry = entries.find((item) => item.id === folder?.entryId);
  const book = books.find((item) => item.id === entry?.bookId);

  if (!folder || !entry || !book) return null;

  const kids = childrenOf(docs, entry.id, folder.id);

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
        <Folder className="size-4 text-primary" />
        <div className="min-w-0 flex-1">
          <Input
            value={folder.name}
            onChange={(event) => renameNode(folder.id, event.target.value)}
            className="h-10 border-0 bg-transparent px-0 font-serif text-lg font-semibold shadow-none focus-visible:ring-0"
            aria-label="文件夹名称"
          />
          <p className="text-xs text-muted-foreground">
            {book.name} / {entry.title || "未命名"}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => createFolder(entry.id, folder.id)}>
          <FolderPlus />
          文件夹
        </Button>
        <Button type="button" size="sm" onClick={() => createDoc(entry.id, folder.id)}>
          <Plus />
          文档
        </Button>
      </header>
      <div className="notes-scroll min-h-0 flex-1 overflow-auto px-4 py-4 md:px-6">
        {kids.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">这个文件夹还是空的。</p>
        ) : (
          <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-card">
            {kids.map((child) => (
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
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{nodeTitle(child)}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatLastEdited(child.updatedAt, now)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
