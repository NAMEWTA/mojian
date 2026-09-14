import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blankField, FIELD_TYPES, type Book, type FieldDef, type FieldType } from "@/lib/archive/types";
import { useI18n } from "@/i18n";

const selectClass =
  "h-10 w-full rounded-lg border border-border bg-card px-2 text-sm text-foreground";

export function FieldListEditor({
  fields,
  books,
  excludeBookId,
  onChange,
}: {
  fields: FieldDef[];
  books: Book[];
  excludeBookId?: string;
  onChange: (fields: FieldDef[]) => void;
}) {
  const { t } = useI18n();

  function patch(index: number, next: FieldDef) {
    onChange(fields.map((field, i) => (i === index ? next : field)));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= fields.length) return;
    const copy = [...fields];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    onChange(copy);
  }

  return (
    <div>
      {fields.length === 0 ? (
        <p className="rounded-xl bg-secondary px-4 py-5 text-sm text-muted-foreground">
          {t("field.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, index) => (
            <li key={field.id} className="rounded-xl bg-secondary p-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`${field.id}-label`}>{t("field.label")}</Label>
                  <Input
                    id={`${field.id}-label`}
                    className="mt-1 h-10"
                    value={field.label}
                    onChange={(event) => patch(index, { ...field, label: event.target.value })}
                  />
                </div>
                <div className="w-28">
                  <Label htmlFor={`${field.id}-type`}>{t("field.type")}</Label>
                  <select
                    id={`${field.id}-type`}
                    className={`mt-1 ${selectClass}`}
                    value={field.type}
                    onChange={(event) =>
                      patch(index, { ...field, type: event.target.value as FieldType })
                    }
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(`field.type.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("field.moveUp")}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("field.moveDown")}
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("field.delete")}
                    onClick={() => onChange(fields.filter((item) => item.id !== field.id))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              {field.type === "select" ? (
                <div className="mt-2">
                  <Label htmlFor={`${field.id}-options`}>{t("field.options")}</Label>
                  <Input
                    id={`${field.id}-options`}
                    className="mt-1 h-10"
                    value={(field.options ?? []).join("、")}
                    onChange={(event) =>
                      patch(index, {
                        ...field,
                        options: event.target.value
                          .split(/[、,，]/)
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              ) : null}
              {field.type === "relation" ? (
                <div className="mt-2">
                  <Label htmlFor={`${field.id}-rel`}>{t("field.relationBook")}</Label>
                  <select
                    id={`${field.id}-rel`}
                    className={`mt-1 ${selectClass}`}
                    value={field.relationBookId ?? ""}
                    onChange={(event) =>
                      patch(index, {
                        ...field,
                        relationBookId: event.target.value || undefined,
                      })
                    }
                  >
                    <option value="">{t("field.choose")}</option>
                    {books
                      .filter((item) => item.id !== excludeBookId)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </select>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full rounded-xl"
        onClick={() => onChange([...fields, blankField({ label: t("field.new") })])}
      >
        <Plus />
        {t("field.add")}
      </Button>
    </div>
  );
}
