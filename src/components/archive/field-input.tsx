import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { entryTitle } from "@/lib/archive/store";
import type { Book, Entry, FieldDef } from "@/lib/archive/types";
import { useI18n } from "@/i18n";

const nativeClass =
  "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-border outline-none transition-[box-shadow,border-color] duration-150 ease-out placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export function FieldInput({
  field,
  value,
  books,
  entries,
  onChange,
  onOpenRelated,
}: {
  field: FieldDef;
  value: string;
  books: Book[];
  entries: Entry[];
  onChange: (value: string) => void;
  onOpenRelated?: (entryId: string) => void;
}) {
  const { t } = useI18n();
  const inputType =
    field.type === "phone"
      ? "tel"
      : field.type === "email"
        ? "email"
        : field.type === "url"
          ? "url"
          : field.type === "date"
            ? "date"
            : "text";

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={field.id}>{field.label}</Label>
      {field.type === "select" ? (
        <select
          id={field.id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={nativeClass}
        >
          <option value="">{t("field.choose")}</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === "relation" ? (
        <div className="flex gap-2">
          <select
            id={field.id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={cn(nativeClass, "min-w-0 flex-1")}
          >
            <option value="">{t("field.unrelated")}</option>
            {entries
              .filter((entry) => entry.bookId === field.relationBookId)
              .map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entryTitle(entry)}
                </option>
              ))}
          </select>
          {value && onOpenRelated ? (
            <button
              type="button"
              className="h-10 shrink-0 rounded-lg px-3 text-xs font-medium text-primary hover:bg-accent"
              onClick={() => onOpenRelated(value)}
            >
              {t("field.open")}
            </button>
          ) : null}
        </div>
      ) : (
        <input
          id={field.id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={nativeClass}
          placeholder={field.label}
        />
      )}
      {field.type === "relation" ? (
        <p className="text-xs text-muted-foreground">
          {t("field.relatedTo", {
            name: books.find((book) => book.id === field.relationBookId)?.name ?? t("field.anotherBook"),
          })}
        </p>
      ) : null}
    </div>
  );
}
