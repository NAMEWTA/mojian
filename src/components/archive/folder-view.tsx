import { FolderPlus, Menu, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DocTree } from "@/components/archive/doc-tree";
import { KindIcon } from "@/components/archive/kind-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { childrenOf, useArchiveStore } from "@/lib/archive/store";
import { useI18n } from "@/i18n";

export function FolderView({
  now,
  onOpenSidebar,
  onDeleteFolder,
  onDeleteNode,
}: {
  now: number;
  onOpenSidebar: () => void;
  onDeleteFolder: () => void;
  onDeleteNode: (id: string) => void;
}) {
  const { t } = useI18n();
  const docs = useArchiveStore((s) => s.docs);
  const entries = useArchiveStore((s) => s.entries);
  const books = useArchiveStore((s) => s.books);
  const selectedDocId = useArchiveStore((s) => s.selectedDocId);
  const renameNode = useArchiveStore((s) => s.renameNode);
  const createDoc = useArchiveStore((s) => s.createDoc);
  const createFolder = useArchiveStore((s) => s.createFolder);
  const folder = docs.find((item) => item.id === selectedDocId && item.kind === "folder");
  const entry = entries.find((item) => item.id === folder?.entryId);
  const book = books.find((item) => item.id === entry?.bookId);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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
          aria-label={t("nav.openTree")}
        >
          <Menu />
        </Button>
        <KindIcon kind="folder" open />
        <div className="min-w-0 flex-1">
          <Input
            value={folder.name}
            onChange={(event) => renameNode(folder.id, event.target.value)}
            className="h-10 border-0 bg-transparent px-0 font-serif text-lg font-semibold shadow-none focus-visible:ring-0"
            aria-label={t("folder.name")}
          />
          <p className="text-xs text-muted-foreground">
            {book.name} / {entry.title || t("entry.untitled")}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => createFolder(entry.id, folder.id)}>
          <FolderPlus />
          {t("entry.folder")}
        </Button>
        <Button type="button" size="sm" onClick={() => createDoc(entry.id, folder.id)}>
          <Plus />
          {t("entry.file")}
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onDeleteFolder} aria-label={t("folder.delete")}>
          <Trash2 />
        </Button>
      </header>
      <div className="notes-scroll min-h-0 flex-1 overflow-auto px-4 py-4 md:px-6">
        {kids.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{t("folder.empty")}</p>
        ) : (
          <div className="rounded-xl border border-hairline bg-card p-2">
            <DocTree
              entryId={entry.id}
              parentId={folder.id}
              now={now}
              showTime
              onDelete={onDeleteNode}
              collapsed={collapsed}
              toggle={(id) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))}
            />
          </div>
        )}
      </div>
    </section>
  );
}
