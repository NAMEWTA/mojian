import { useCallback, useEffect, useRef, useState } from "react";
import { EditorPane } from "@/components/notes/editor-pane";
import { ShortcutsDialog } from "@/components/notes/shortcuts-dialog";
import { Sidebar } from "@/components/notes/sidebar";
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
import { noteTitle } from "@/lib/notes/format";
import { useNotesStore } from "@/lib/notes/store";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function NotesApp() {
  const { t } = useI18n();
  const searchRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const pendingFocus = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const isDesktop = useIsDesktop();

  const notes = useNotesStore((s) => s.notes);
  const selectedId = useNotesStore((s) => s.selectedId);
  const search = useNotesStore((s) => s.search);
  const createNote = useNotesStore((s) => s.createNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const setSearch = useNotesStore((s) => s.setSearch);
  const togglePreview = useNotesStore((s) => s.togglePreview);
  const selectOffset = useNotesStore((s) => s.selectOffset);
  const selected = notes.find((note) => note.id === selectedId) ?? null;

  useEffect(() => {
    void Promise.resolve(useNotesStore.persist.rehydrate());
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const handleCreate = useCallback(() => {
    pendingFocus.current = true;
    createNote();
    setSidebarOpen(false);
  }, [createNote]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    editorRef.current?.focus();
  }, [selectedId]);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    deleteNote(selectedId);
    setDeleteOpen(false);
  }, [deleteNote, selectedId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      const typing = isTypingTarget(event.target);

      if (meta && event.key.toLowerCase() === "n") {
        event.preventDefault();
        handleCreate();
        return;
      }
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSidebarOpen(true);
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (meta && event.key.toLowerCase() === "e") {
        event.preventDefault();
        togglePreview();
        return;
      }
      if (meta && event.key.toLowerCase() === "s") {
        event.preventDefault();
        return;
      }
      if (meta && event.shiftKey && (event.key === "Backspace" || event.key === "Delete")) {
        event.preventDefault();
        if (selectedId) setDeleteOpen(true);
        return;
      }
      if (event.key === "Escape") {
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          return;
        }
        if (search) {
          setSearch("");
          return;
        }
        setSidebarOpen(false);
        (event.target as HTMLElement | null)?.blur?.();
        return;
      }
      if (!typing && event.key === "/") {
        event.preventDefault();
        setSidebarOpen(true);
        searchRef.current?.focus();
        return;
      }
      if (!typing && event.key === "?") {
        event.preventDefault();
        setShortcutsOpen((open) => !open);
        return;
      }
      if (!typing && (event.key === "ArrowDown" || event.key === "j")) {
        event.preventDefault();
        selectOffset(1);
        return;
      }
      if (!typing && (event.key === "ArrowUp" || event.key === "k")) {
        event.preventDefault();
        selectOffset(-1);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    handleCreate,
    search,
    selectedId,
    selectOffset,
    setSearch,
    shortcutsOpen,
    togglePreview,
  ]);

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
            "fixed top-12 bottom-0 left-0 z-40 w-72 border-r border-hairline bg-sidebar transition-transform duration-200 ease-smooth-out md:static md:z-0 md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
          aria-hidden={isDesktop === false && !sidebarOpen}
          inert={isDesktop === false && !sidebarOpen}
        >
          <Sidebar
            searchRef={searchRef}
            now={now}
            onClose={() => setSidebarOpen(false)}
            onCreate={handleCreate}
          />
        </aside>
        <EditorPane
          editorRef={editorRef}
          now={now}
          onOpenSidebar={() => setSidebarOpen(true)}
          onRequestDelete={() => setDeleteOpen(true)}
          onCreate={handleCreate}
        />
      </div>

      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("notes.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selected
                ? t("notes.deleteBody", { name: noteTitle(selected.content) })
                : t("notes.deleteEmpty")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t("delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
