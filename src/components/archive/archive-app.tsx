import { Group, Panel, Separator } from "react-resizable-panels";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArchiveSidebar } from "@/components/archive/archive-sidebar";
import { BookView } from "@/components/archive/book-view";
import { DocView } from "@/components/archive/doc-view";
import { EntryView } from "@/components/archive/entry-view";
import { FolderView } from "@/components/archive/folder-view";
import { NewBookDialog } from "@/components/archive/new-book-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { entryTitle, getFocus, nodeTitle, useArchiveStore } from "@/lib/archive/store";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function ArchiveApp() {
  const { t } = useI18n();
  const searchRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newBookOpen, setNewBookOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "book"; id: string }
    | { kind: "entry"; id: string }
    | { kind: "node"; id: string }
    | null
  >(null);
  const [now, setNow] = useState(() => Date.now());

  const books = useArchiveStore((s) => s.books);
  const entries = useArchiveStore((s) => s.entries);
  const docs = useArchiveStore((s) => s.docs);
  const selectedBookId = useArchiveStore((s) => s.selectedBookId);
  const selectedEntryId = useArchiveStore((s) => s.selectedEntryId);
  const selectedDocId = useArchiveStore((s) => s.selectedDocId);
  const createEntry = useArchiveStore((s) => s.createEntry);
  const deleteBook = useArchiveStore((s) => s.deleteBook);
  const deleteEntry = useArchiveStore((s) => s.deleteEntry);
  const deleteNode = useArchiveStore((s) => s.deleteNode);

  const focus = getFocus({ selectedBookId, selectedEntryId, selectedDocId, docs });

  useEffect(() => {
    void Promise.resolve(useArchiveStore.persist.rehydrate());
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const handleCreateEntry = useCallback(
    (bookId: string) => {
      createEntry(bookId);
      setSidebarOpen(false);
    },
    [createEntry],
  );

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "book") deleteBook(deleteTarget.id);
    if (deleteTarget.kind === "entry") deleteEntry(deleteTarget.id);
    if (deleteTarget.kind === "node") deleteNode(deleteTarget.id);
    setDeleteTarget(null);
  }

  const deleteCopy = (() => {
    if (!deleteTarget) return { title: "", body: "" };
    if (deleteTarget.kind === "book") {
      const book = books.find((item) => item.id === deleteTarget.id);
      return {
        title: t("delete.bookTitle"),
        body: t("delete.bookBody", { name: book?.name ?? t("defaults.untitledBook") }),
      };
    }
    if (deleteTarget.kind === "entry") {
      const entry = entries.find((item) => item.id === deleteTarget.id);
      return {
        title: t("delete.entryTitle"),
        body: t("delete.entryBody", {
          name: entry ? entryTitle(entry) : t("entry.untitled"),
        }),
      };
    }
    const node = docs.find((item) => item.id === deleteTarget.id);
    return {
      title: node?.kind === "folder" ? t("delete.folderTitle") : t("delete.fileTitle"),
      body: t("delete.nodeBody", { name: node ? nodeTitle(node) : t("entry.untitled") }),
    };
  })();

  const main =
    focus === "file" ? (
      <DocView now={now} onOpenSidebar={() => setSidebarOpen(true)} />
    ) : focus === "folder" ? (
      <FolderView
        now={now}
        onOpenSidebar={() => setSidebarOpen(true)}
        onDeleteFolder={() =>
          selectedDocId && setDeleteTarget({ kind: "node", id: selectedDocId })
        }
        onDeleteNode={(id) => setDeleteTarget({ kind: "node", id })}
      />
    ) : focus === "entry" ? (
      <EntryView
        now={now}
        onOpenSidebar={() => setSidebarOpen(true)}
        onDeleteEntry={() =>
          selectedEntryId && setDeleteTarget({ kind: "entry", id: selectedEntryId })
        }
        onDeleteNode={(id) => setDeleteTarget({ kind: "node", id })}
      />
    ) : (
      <BookView
        now={now}
        onOpenSidebar={() => setSidebarOpen(true)}
        onCreateEntry={handleCreateEntry}
        onDeleteBook={(id) => setDeleteTarget({ kind: "book", id })}
      />
    );

  const sidebar = (
    <ArchiveSidebar
      searchRef={searchRef}
      onClose={() => setSidebarOpen(false)}
      onCreateBook={() => setNewBookOpen(true)}
      onCreateEntry={handleCreateEntry}
      onDeleteNode={(id) => setDeleteTarget({ kind: "node", id })}
    />
  );

  return (
    <TooltipProvider>
      <div className="flex h-full overflow-hidden bg-background text-foreground">
        <div
          className={cn(
            "fixed top-12 right-0 bottom-0 left-0 z-30 bg-foreground/20 transition-opacity duration-200 ease-smooth-out md:hidden",
            sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setSidebarOpen(false)}
          aria-hidden={!sidebarOpen}
        />
        <aside
          className={cn(
            "fixed top-12 bottom-0 left-0 z-40 w-72 border-r border-hairline bg-sidebar transition-transform duration-200 ease-smooth-out md:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
          aria-hidden={!sidebarOpen}
          inert={!sidebarOpen}
        >
          {sidebar}
        </aside>

        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:hidden">{main}</div>

        <div className="hidden h-full min-h-0 min-w-0 flex-1 md:flex">
          <Group orientation="horizontal" className="h-full min-h-0 w-full">
            <Panel
              id="tree"
              defaultSize="18rem"
              minSize="14rem"
              maxSize="28rem"
              className="min-h-0 bg-sidebar"
            >
              {sidebar}
            </Panel>
            <Separator className="w-px bg-hairline hover:bg-primary" />
            <Panel id="main" minSize="24rem" className="flex h-full min-h-0 flex-col overflow-hidden">
              {main}
            </Panel>
          </Group>
        </div>
      </div>

      <NewBookDialog open={newBookOpen} onClose={() => setNewBookOpen(false)} />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{deleteCopy.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {t("delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
