import { useEffect } from "react";
import { useModSymbol } from "@/lib/utils";

const SHORTCUTS = [
  { keys: (mod: string) => `${mod} N`, label: "新建笔记" },
  { keys: (mod: string) => `${mod} K  /`, label: "搜索" },
  { keys: (mod: string) => `${mod} E`, label: "切换预览" },
  { keys: (mod: string) => `${mod} Shift ⌫`, label: "删除当前笔记" },
  { keys: () => "↑  ↓", label: "上一条 / 下一条" },
  { keys: () => "Esc", label: "关闭搜索或侧栏" },
  { keys: () => "?", label: "快捷键说明" },
];

export function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const mod = useModSymbol();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/30"
        aria-label="关闭快捷键说明"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="relative w-full max-w-sm rounded-xl bg-card p-6 shadow-elevated"
      >
        <h2
          id="shortcuts-title"
          className="font-serif text-lg font-semibold tracking-tight"
        >
          键盘快捷键
        </h2>
        <ul className="mt-4 space-y-2.5">
          {SHORTCUTS.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <kbd className="rounded-md bg-secondary px-2 py-1 font-mono text-xs text-foreground">
                {item.keys(mod)}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
