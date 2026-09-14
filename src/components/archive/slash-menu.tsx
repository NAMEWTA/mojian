import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Table,
} from "lucide-react";
import { useEffect, useRef } from "react";
import type { SlashGroup, SlashId, SlashItem } from "@/lib/slash";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const ICONS: Record<SlashId, typeof Heading1> = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  bullet: List,
  ordered: ListOrdered,
  task: ListTodo,
  quote: Quote,
  code: Code2,
  table: Table,
  divider: Minus,
  image: ImagePlus,
};

export function SlashMenu({
  items,
  active,
  top,
  left,
  onHover,
  onPick,
}: {
  items: SlashItem[];
  active: number;
  top: number;
  left: number;
  onHover: (index: number) => void;
  onPick: (item: SlashItem) => void;
}) {
  const { t } = useI18n();
  const activeRef = useRef<HTMLButtonElement>(null);
  const groups: SlashGroup[] = ["basic", "insert"];

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <div
      role="listbox"
      aria-label={t("slash.aria")}
      className="slash-menu"
      style={{ top, left }}
    >
      {items.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">{t("slash.empty")}</p>
      ) : (
        groups.map((group) => {
          const rows = items.filter((item) => item.group === group);
          if (rows.length === 0) return null;
          return (
            <div key={group} role="group" aria-label={t(`slash.group.${group}`)}>
              <p className="slash-group-label">{t(`slash.group.${group}`)}</p>
              {rows.map((item) => {
                const index = items.indexOf(item);
                const Icon = ICONS[item.id];
                const selected = index === active;
                return (
                  <button
                    key={item.id}
                    ref={selected ? activeRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn("slash-item", selected && "slash-item-active")}
                    onMouseEnter={() => onHover(index)}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onPick(item);
                    }}
                  >
                    <span className="slash-item-icon">
                      <Icon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{t(`slash.${item.id}`)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t(`slash.${item.id}Hint`)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
