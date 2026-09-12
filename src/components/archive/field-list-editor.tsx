import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { blankField, FIELD_TYPES, type Book, type FieldDef, type FieldType } from "@/lib/archive/types";

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
          还没有字段。加上电话、行业、日期之类，这本簿里的每条档案都会带上它们。
        </p>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, index) => (
            <li key={field.id} className="rounded-xl bg-secondary p-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`${field.id}-label`}>字段名</Label>
                  <Input
                    id={`${field.id}-label`}
                    className="mt-1 h-10"
                    value={field.label}
                    onChange={(event) => patch(index, { ...field, label: event.target.value })}
                  />
                </div>
                <div className="w-28">
                  <Label htmlFor={`${field.id}-type`}>类型</Label>
                  <select
                    id={`${field.id}-type`}
                    className={`mt-1 ${selectClass}`}
                    value={field.type}
                    onChange={(event) =>
                      patch(index, { ...field, type: event.target.value as FieldType })
                    }
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="上移"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="下移"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="删除字段"
                    onClick={() => onChange(fields.filter((item) => item.id !== field.id))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              {field.type === "select" ? (
                <div className="mt-2">
                  <Label htmlFor={`${field.id}-options`}>选项，用顿号或逗号分开</Label>
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
                  <Label htmlFor={`${field.id}-rel`}>关联到哪本簿</Label>
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
                    <option value="">选择</option>
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
        onClick={() => onChange([...fields, blankField({ label: "新字段" })])}
      >
        <Plus />
        添加字段
      </Button>
    </div>
  );
}
