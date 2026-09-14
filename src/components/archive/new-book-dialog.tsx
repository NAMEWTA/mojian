import { useState } from "react";
import { FieldListEditor } from "@/components/archive/field-list-editor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useArchiveStore } from "@/lib/archive/store";
import {
  blankField,
  companyFieldTemplate,
  peopleFieldTemplate,
  type BookGlyph,
  type FieldDef,
} from "@/lib/archive/types";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

function fromTemplate(rows: Array<Omit<FieldDef, "id">>): FieldDef[] {
  return rows.map((row) => blankField(row));
}

const TEMPLATE_GLYPH: Record<"blank" | "notes" | "people" | "company", BookGlyph> = {
  blank: "library",
  notes: "notes",
  people: "people",
  company: "company",
};

export function NewBookDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
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
      setName((prev) => prev || t("newBook.notesName"));
      setFields([]);
    }
    if (next === "people") {
      setName((prev) => prev || t("newBook.peopleName"));
      setFields(fromTemplate(peopleFieldTemplate()));
    }
    if (next === "company") {
      setName((prev) => prev || t("newBook.companyName"));
      setFields(fromTemplate(companyFieldTemplate()));
    }
  }

  function submit() {
    createBook(name, fields, TEMPLATE_GLYPH[template]);
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
        <DialogTitle>{t("newBook.title")}</DialogTitle>
        <DialogDescription>{t("newBook.desc")}</DialogDescription>

        <div className="mt-4">
          <Label htmlFor="new-book-name">{t("newBook.name")}</Label>
          <Input
            id="new-book-name"
            className="mt-1"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("newBook.placeholder")}
          />
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">{t("newBook.templates")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["blank", "newBook.blank"],
                ["notes", "newBook.notes"],
                ["people", "newBook.people"],
                ["company", "newBook.company"],
              ] as const
            ).map(([id, key]) => (
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
                {t(key)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t("newBook.fields")}</p>
          <FieldListEditor fields={fields} books={books} onChange={setFields} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("newBook.cancel")}
          </Button>
          <Button type="button" onClick={submit}>
            {t("newBook.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
