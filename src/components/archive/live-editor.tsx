import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { SlashMenu } from "@/components/archive/slash-menu";
import { MarkdownPreview } from "@/components/notes/markdown-preview";
import { isImageFile, saveImageFile } from "@/lib/assets";
import { textareaCaretRect } from "@/lib/caret";
import {
  blockKind,
  imageMarkdown,
  joinMarkdownBlocks,
  splitMarkdownBlocks,
  toggleTaskAt,
} from "@/lib/markdown-blocks";
import {
  applySlashItem,
  filterSlashItems,
  matchSlash,
  type SlashItem,
  type SlashMatch,
} from "@/lib/slash";

type SlashState = {
  match: SlashMatch;
  items: SlashItem[];
  active: number;
  top: number;
  left: number;
};

const MENU_WIDTH = 272;
const MENU_HEIGHT = 320;

function clampMenu(left: number, top: number, caretTop: number) {
  const maxLeft = Math.max(8, window.innerWidth - MENU_WIDTH - 8);
  const nextLeft = Math.min(Math.max(8, left), maxLeft);
  let nextTop = top;
  if (nextTop + MENU_HEIGHT > window.innerHeight - 8) {
    nextTop = Math.max(8, caretTop - MENU_HEIGHT - 6);
  }
  return { left: nextLeft, top: nextTop };
}

function autosize(el: HTMLTextAreaElement) {
  el.style.height = "0px";
  el.style.height = `${Math.max(el.scrollHeight, 32)}px`;
}

export type LiveEditorHandle = {
  insertSnippet: (snippet: string) => void;
  focus: () => void;
};

export const LiveEditor = forwardRef<
  LiveEditorHandle,
  {
    docId: string;
    content: string;
    onChange: (content: string) => void;
    placeholder: string;
    ariaLabel: string;
  }
>(function LiveEditor({ docId, content, onChange, placeholder, ariaLabel }, ref) {
  const blocks = splitMarkdownBlocks(content);
  const [focused, setFocused] = useState<number | null>(null);
  const [slash, setSlash] = useState<SlashState | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const slashRef = useRef<SlashState | null>(null);
  const focusedRef = useRef<number | null>(null);
  const blocksRef = useRef(blocks);
  const caretRef = useRef<number | null>(null);

  slashRef.current = slash;
  focusedRef.current = focused;
  blocksRef.current = blocks;

  useEffect(() => {
    setFocused(content.trim() ? null : 0);
    setSlash(null);
    // Only reset when switching documents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    autosize(el);
    el.focus();
    const caret = caretRef.current;
    if (caret != null) {
      el.selectionStart = el.selectionEnd = Math.min(caret, el.value.length);
      caretRef.current = null;
    }
  }, [focused]);

  function emit(nextBlocks: string[]) {
    const normalized = nextBlocks.length ? nextBlocks : [""];
    blocksRef.current = normalized;
    onChange(joinMarkdownBlocks(normalized));
  }

  function dropEmpty(except: number | null) {
    const current = blocksRef.current;
    const next = current.filter((block, index) => block.trim() || index === except);
    return next.length ? next : [""];
  }

  function focusAt(index: number | null, caret?: number) {
    const cleaned = dropEmpty(index);
    let nextIndex = index;
    if (index != null && cleaned.length !== blocksRef.current.length) {
      const prev = focusedRef.current;
      if (prev != null && index > prev) nextIndex = index - 1;
    }
    if (nextIndex != null) {
      nextIndex = Math.max(0, Math.min(nextIndex, cleaned.length));
    }
    if (caret != null) caretRef.current = caret;
    focusedRef.current = nextIndex;
    setFocused(nextIndex);
    if (cleaned.join("\n\n") !== blocksRef.current.join("\n\n")) {
      emit(cleaned);
    }
  }

  function startAtEnd() {
    const list = blocksRef.current;
    const last = Math.max(0, list.length - 1);
    const value = list[last] ?? "";
    const next = !value.trim() ? last : list.length;
    const caret = !value.trim() ? value.length : 0;
    caretRef.current = caret;
    if (focusedRef.current === next) {
      const el = editorRef.current;
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = Math.min(caret, el.value.length);
      }
      return;
    }
    focusAt(next, caret);
  }

  function updateFocused(value: string, caret?: number) {
    const index = focusedRef.current;
    const current = blocksRef.current;
    if (index == null) {
      emit([value]);
      focusAt(0, caret ?? value.length);
      return;
    }
    if (index >= current.length) {
      if (!value.trim()) {
        if (caret != null) caretRef.current = caret;
        return;
      }
      if (value.includes("\n\n")) {
        const parts = value.split(/\n\n+/);
        const next = [...current, ...parts];
        const last = current.length + parts.length - 1;
        emit(next);
        focusAt(last, caret ?? parts[parts.length - 1]?.length ?? 0);
        return;
      }
      emit([...current, value]);
      focusAt(current.length, caret ?? value.length);
      return;
    }
    if (value.includes("\n\n")) {
      const parts = value.split(/\n\n+/);
      const next = [...current.slice(0, index), ...parts, ...current.slice(index + 1)];
      const last = index + parts.length - 1;
      emit(next);
      focusAt(last, caret ?? parts[parts.length - 1]?.length ?? 0);
      return;
    }
    const next = current.map((block, i) => (i === index ? value : block));
    if (caret != null) caretRef.current = caret;
    emit(next);
    window.requestAnimationFrame(() => {
      const el = editorRef.current;
      if (!el) return;
      autosize(el);
      if (caret != null) {
        el.selectionStart = el.selectionEnd = Math.min(caret, el.value.length);
      }
    });
  }

  function refreshSlash(target: HTMLTextAreaElement, keepActive = false) {
    const match = matchSlash(target.value, target.selectionStart);
    if (!match) {
      setSlash(null);
      return;
    }
    const items = filterSlashItems(match.query);
    const caret = textareaCaretRect(target, match.start);
    const pos = clampMenu(caret.left, caret.top + caret.height + 6, caret.top);
    const prev = slashRef.current;
    const activeIndex =
      keepActive && prev ? Math.min(prev.active, Math.max(0, items.length - 1)) : 0;
    setSlash({ match, items, active: activeIndex, top: pos.top, left: pos.left });
  }

  function applyItem(item: SlashItem) {
    const current = slashRef.current;
    const target = editorRef.current;
    if (!current || !target) return;
    const result = applySlashItem(target.value, current.match, item);
    setSlash(null);
    updateFocused(result.next, result.caret);
    if (item.image) {
      window.requestAnimationFrame(() => {
        document.getElementById("archive-image-input")?.click();
      });
    }
  }

  function insertSnippet(snippet: string) {
    const current = blocksRef.current;
    const target = editorRef.current;
    const index = focusedRef.current;
    if (index == null || !target) {
      const at = current.length ? current.length - 1 : 0;
      const value = current[at] ?? "";
      const nextValue = value.trim() ? `${value}\n${snippet}` : snippet;
      const next = current.length ? current.map((block, i) => (i === at ? nextValue : block)) : [nextValue];
      emit(next);
      focusAt(at, nextValue.length);
      return;
    }
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const next = `${target.value.slice(0, start)}${snippet}${target.value.slice(end)}`;
    updateFocused(next, start + snippet.length);
  }

  useImperativeHandle(ref, () => ({
    insertSnippet,
    focus: () => {
      const at = focusedRef.current ?? (blocksRef.current.length ? blocksRef.current.length - 1 : 0);
      focusAt(at, (blocksRef.current[at] ?? "").length);
    },
  }));

  async function embedImages(files: File[]) {
    const images = files.filter(isImageFile);
    if (images.length === 0) return;
    const chunks: string[] = [];
    for (const image of images) {
      chunks.push(`![](${await saveImageFile(image)})`);
    }
    insertSnippet(chunks.join("\n"));
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    const menu = slashRef.current;
    if (menu) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (menu.items.length === 0) return;
        setSlash({ ...menu, active: (menu.active + 1) % menu.items.length });
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (menu.items.length === 0) return;
        setSlash({
          ...menu,
          active: (menu.active - 1 + menu.items.length) % menu.items.length,
        });
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const item = menu.items[menu.active];
        if (item) {
          event.preventDefault();
          applyItem(item);
          return;
        }
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setSlash(null);
        return;
      }
    }

    const target = event.currentTarget;
    const list = blocksRef.current;
    const index = focusedRef.current ?? 0;
    const virtual = index >= list.length;
    const kind = blockKind(target.value);

    if (virtual) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        return;
      }
      if (
        (event.key === "Backspace" && target.selectionStart === 0 && target.selectionEnd === 0 && !target.value) ||
        (event.key === "ArrowUp" && target.selectionStart === 0)
      ) {
        event.preventDefault();
        const last = Math.max(0, list.length - 1);
        focusAt(last, (list[last] ?? "").length);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey && (kind === "h1" || kind === "h2" || kind === "h3" || kind === "p")) {
      event.preventDefault();
      const start = target.selectionStart;
      const before = target.value.slice(0, start);
      const after = target.value.slice(target.selectionEnd);
      const next = [...list.slice(0, index), before, after, ...list.slice(index + 1)];
      emit(next);
      focusAt(index + 1, 0);
      return;
    }

    if (event.key === "Backspace" && target.selectionStart === 0 && target.selectionEnd === 0 && !target.value && list.length > 1 && index > 0) {
      event.preventDefault();
      const prevLen = (list[index - 1] ?? "").length;
      const next = list.filter((_, i) => i !== index);
      emit(next);
      focusAt(index - 1, prevLen);
      return;
    }

    if (event.key === "ArrowUp" && target.selectionStart === 0 && index > 0) {
      event.preventDefault();
      focusAt(index - 1, (list[index - 1] ?? "").length);
      return;
    }
    if (event.key === "ArrowDown" && target.selectionStart === target.value.length && index < list.length - 1) {
      event.preventDefault();
      focusAt(index + 1, 0);
      return;
    }
    if (event.key === "ArrowDown" && target.selectionStart === target.value.length && index === list.length - 1) {
      event.preventDefault();
      startAtEnd();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const start = target.selectionStart;
      const end = target.selectionEnd;
      updateFocused(`${target.value.slice(0, start)}  ${target.value.slice(end)}`, start + 2);
    }
  }

  function onDrop(event: DragEvent) {
    const files = Array.from(event.dataTransfer.files);
    if (!files.some(isImageFile)) return;
    event.preventDefault();
    void embedImages(files);
  }

  const trailing = focused != null && focused >= blocks.length;
  const view = trailing ? [...blocks, ""] : blocks;
  const liveImages = focused != null ? imageMarkdown(view[focused] ?? "") : "";

  return (
    <div
      className="live-doc notes-scroll min-h-0 flex-1 overflow-y-auto"
      onDrop={onDrop}
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault();
      }}
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const pad = event.currentTarget.querySelector(".live-pad");
        if (!pad) return;
        if (event.clientY >= pad.getBoundingClientRect().top - 12) {
          event.preventDefault();
          startAtEnd();
        }
      }}
    >
      {view.map((block, index) => {
        if (focused === index) {
          return (
            <div key={`b-${index}`} className="live-block live-block-active">
              <textarea
                ref={editorRef}
                id="archive-editor"
                value={block}
                data-kind={blockKind(block)}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                  const native = event.nativeEvent as { isComposing?: boolean };
                  updateFocused(event.target.value, event.target.selectionStart);
                  if (native.isComposing) return;
                  refreshSlash(event.target);
                }}
                onCompositionEnd={(event) => refreshSlash(event.currentTarget)}
                onKeyDown={onKeyDown}
                onSelect={(event) => refreshSlash(event.currentTarget, true)}
                onPaste={(event) => {
                  const files = Array.from(event.clipboardData.files);
                  if (!files.some(isImageFile)) return;
                  event.preventDefault();
                  void embedImages(files);
                }}
                onBlur={() => {
                  window.setTimeout(() => {
                    if (document.activeElement === editorRef.current) return;
                    setSlash(null);
                  }, 0);
                }}
                placeholder={view.length === 1 && !block ? placeholder : ""}
                spellCheck
                aria-label={ariaLabel}
                className="live-input editor-field"
              />
              {liveImages ? (
                <div className="live-image-peek">
                  <MarkdownPreview content={liveImages} compact />
                </div>
              ) : null}
            </div>
          );
        }
        return (
          <div
            key={`b-${index}`}
            className="live-block"
            onMouseDown={(event) => {
              if ((event.target as HTMLElement).closest("a, input, button")) return;
              event.preventDefault();
              focusAt(index, block.length);
            }}
          >
            <MarkdownPreview
              content={block}
              compact
              onTaskToggle={(task) => {
                emit(blocks.map((item, i) => (i === index ? toggleTaskAt(item, task) : item)));
              }}
            />
          </div>
        );
      })}
      <div
        className="live-pad"
        onMouseDown={(event) => {
          event.preventDefault();
          startAtEnd();
        }}
      />
      {slash ? (
        <SlashMenu
          items={slash.items}
          active={slash.active}
          top={slash.top}
          left={slash.left}
          onHover={(index) => {
            const current = slashRef.current;
            if (current) setSlash({ ...current, active: index });
          }}
          onPick={applyItem}
        />
      ) : null}
    </div>
  );
});
