import { ChevronDown, FolderPlus, Plus, X } from "lucide-react";
import { KindIcon } from "@/components/archive/kind-icon";
import { HighlightText } from "@/components/notes/highlight-text";
import { formatLastEdited } from "@/lib/notes/format";
import { childrenOf, nodeTitle, useArchiveStore } from "@/lib/archive/store";
import type { ArchiveNode } from "@/lib/archive/types";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function DocTree({
  entryId,
  parentId,
  query = "",
  now,
  showTime = false,
  onOpen,
  onDelete,
  collapsed,
  toggle,
}: {
  entryId: string;
  parentId: string | null;
  query?: string;
  now?: number;
  showTime?: boolean;
  onOpen?: () => void;
  onDelete: (id: string) => void;
  collapsed: Record<string, boolean>;
  toggle: (id: string) => void;
}) {
  const docs = useArchiveStore((s) => s.docs);
  const nodes = childrenOf(docs, entryId, parentId);
  const { t, locale } = useI18n();

  if (nodes.length === 0) return null;

  return (
    <ul className={parentId ? "ml-3 border-l border-hairline pl-1" : "space-y-0.5"}>
      {nodes.map((node) => (
        <DocTreeNode
          key={node.id}
          node={node}
          entryId={entryId}
          query={query}
          now={now}
          showTime={showTime}
          onOpen={onOpen}
          onDelete={onDelete}
          collapsed={collapsed}
          toggle={toggle}
          t={t}
          locale={locale}
        />
      ))}
    </ul>
  );
}

function DocTreeNode({
  node,
  entryId,
  query,
  now,
  showTime,
  onOpen,
  onDelete,
  collapsed,
  toggle,
  t,
  locale,
}: {
  node: ArchiveNode;
  entryId: string;
  query: string;
  now?: number;
  showTime?: boolean;
  onOpen?: () => void;
  onDelete: (id: string) => void;
  collapsed: Record<string, boolean>;
  toggle: (id: string) => void;
  t: (key: string) => string;
  locale: "zh" | "en";
}) {
  const selectedDocId = useArchiveStore((s) => s.selectedDocId);
  const selectNode = useArchiveStore((s) => s.selectNode);
  const createDoc = useArchiveStore((s) => s.createDoc);
  const createFolder = useArchiveStore((s) => s.createFolder);
  const isFolder = node.kind === "folder";
  const open = !collapsed[node.id];
  const selected = node.id === selectedDocId;

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-0.5 rounded-lg pr-1",
          selected ? "bg-card shadow-border" : "hover:bg-accent/70",
        )}
      >
        {isFolder ? (
          <button
            type="button"
            className="flex size-7 shrink-0 items-center justify-center text-muted-foreground"
            aria-label={open ? t("nav.collapse") : t("nav.expand")}
            onClick={(event) => {
              event.stopPropagation();
              toggle(node.id);
            }}
          >
            <ChevronDown
              className={cn("size-3.5 transition-transform duration-150", !open && "-rotate-90")}
            />
          </button>
        ) : (
          <span className="size-7 shrink-0" />
        )}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-sm"
          onClick={() => {
            selectNode(node.id);
            onOpen?.();
          }}
        >
          <KindIcon kind={isFolder ? "folder" : "file"} open={isFolder && open} />
          <span className="min-w-0 flex-1 truncate">
            <HighlightText text={nodeTitle(node)} query={query} />
          </span>
          {showTime && now ? (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatLastEdited(node.updatedAt, now, locale)}
            </span>
          ) : null}
        </button>
        <div className="flex shrink-0 opacity-0 group-hover:opacity-100">
          {isFolder ? (
            <>
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                aria-label={t("nav.newDocHere")}
                onClick={() => createDoc(entryId, node.id)}
              >
                <Plus className="size-3" />
              </button>
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                aria-label={t("nav.newFolderHere")}
                onClick={() => createFolder(entryId, node.id)}
              >
                <FolderPlus className="size-3" />
              </button>
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
                aria-label={t("nav.deleteFolder")}
                onClick={() => onDelete(node.id)}
              >
                <X className="size-3" />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
              aria-label={t("nav.deleteDoc")}
              onClick={() => onDelete(node.id)}
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>
      {isFolder && open ? (
        <DocTree
          entryId={entryId}
          parentId={node.id}
          query={query}
          now={now}
          showTime={showTime}
          onOpen={onOpen}
          onDelete={onDelete}
          collapsed={collapsed}
          toggle={toggle}
        />
      ) : null}
    </li>
  );
}
