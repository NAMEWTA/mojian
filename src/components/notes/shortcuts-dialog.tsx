import { useEffect } from "react";
import { useI18n } from "@/i18n";
import { useModSymbol } from "@/lib/utils";

const SHORTCUTS = [
  { keys: (mod: string) => `${mod} N`, label: "shortcuts.new" },
  { keys: (mod: string) => `${mod} K  /`, label: "shortcuts.search" },
  { keys: (mod: string) => `${mod} E`, label: "shortcuts.preview" },
  { keys: (mod: string) => `${mod} Shift ⌫`, label: "shortcuts.delete" },
  { keys: () => "↑  ↓", label: "shortcuts.next" },
  { keys: () => "Esc", label: "shortcuts.escape" },
  { keys: () => "?", label: "shortcuts.help" },
];

export function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();

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
        aria-label={t("shortcuts.close")}
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
          {t("shortcuts.title")}
        </h2>
        <ul className="mt-4 space-y-2.5">
          {SHORTCUTS.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground">{t(item.label)}</span>
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
