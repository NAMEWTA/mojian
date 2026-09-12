import { useState } from "react";
import { FieldListEditor } from "@/components/archive/field-list-editor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useArchiveStore } from "@/lib/archive/store";
import {
  blankField,
  COMPANY_FIELD_TEMPLATE,
  PEOPLE_FIELD_TEMPLATE,
  type FieldDef,
} from "@/lib/archive/types";
import { cn } from "@/lib/utils";

function fromTemplate(rows: Array<Omit<FieldDef, "id">>): FieldDef[] {
  return rows.map((row) => blankField(row));
}

export function NewBookDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const books = useArchiveStore((s) => s.books);
  const createBook = useArchiveStore((s) => s.createBook);
  const [name, setName] = useState("");
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [template, setTemplate] = useState<"blank" | "notes" | "people" | "company">("blank");

  function reset() {
    setName("");
    setFields([]);
    setTemplate("blank");
  }

  function applyTemplate(next: "blank" | "notes" | "people" | "company") {
    setTemplate(next);
    if (next === "blank") setFields([]);
    if (next === "notes") {
      setName((prev) => prev || "笔记簿");
      setFields([]);
    }
    if (next === "people") {
      setName((prev) => prev || "人脉簿");
      setFields(fromTemplate(PEOPLE_FIELD_TEMPLATE));
    }
    if (next === "company") {
      setName((prev) => prev || "企业簿");
      setFields(fromTemplate(COMPANY_FIELD_TEMPLATE));
    }
  }

  function submit() {
    createBook(name, fields);
    reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="dialog-panel-lg">
        <DialogTitle>新建一本簿</DialogTitle>
        <DialogDescription>
          先定簿名和字段。字段就是这本簿里每条档案都会有的属性，例如电话、行业。
        </DialogDescription>

        <div className="mt-4">
          <Label htmlFor="new-book-name">簿名</Label>
          <Input
            id="new-book-name"
            className="mt-1"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：项目簿"
          />
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">从模板开始</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["blank", "空白"],
                ["notes", "笔记"],
                ["people", "人脉"],
                ["company", "企业"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => applyTemplate(id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium",
                  template === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-muted-foreground">这本簿的字段</p>
          <FieldListEditor fields={fields} books={books} onChange={setFields} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="button" onClick={submit}>
            创建这本簿
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
