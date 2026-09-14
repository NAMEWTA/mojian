import { useState } from "react";
import { Shuffle } from "lucide-react";
import { FieldListEditor } from "@/components/archive/field-list-editor";
import { KindIcon } from "@/components/archive/kind-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useArchiveStore } from "@/lib/archive/store";
import {
  BOOK_GLYPHS,
  blankField,
  companyFieldTemplate,
  glyphForBook,
  peopleFieldTemplate,
  pickUnusedGlyph,
  type BookGlyph,
  type FieldDef,
} from "@/lib/archive/types";
import { useI18n } from "@/i18n";
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
  const { t } = useI18n();
  const books = useArchiveStore((s) => s.books);
  const createBook = useArchiveStore((s) => s.createBook);
  const [name, setName] = useState("");
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [template, setTemplate] = useState<"blank" | "notes" | "people" | "company">("blank");
  const [glyph, setGlyph] = useState<BookGlyph | null>(null);

  function reset() {
    setName("");
    setFields([]);
    setTemplate("blank");
    setGlyph(null);
  }

  function applyTemplate(next: "blank" | "notes" | "people" | "company") {
    setTemplate(next);
    if (next === "blank") {
      setFields([]);
      setGlyph(null);
    }
    if (next === "notes") {
      setName((prev) => prev || t("newBook.notesName"));
      setFields([]);
      setGlyph("notes");
    }
    if (next === "people") {
      setName((prev) => prev || t("newBook.peopleName"));
      setFields(fromTemplate(peopleFieldTemplate()));
      setGlyph("people");
    }
    if (next === "company") {
      setName((prev) => prev || t("newBook.companyName"));
      setFields(fromTemplate(companyFieldTemplate()));
      setGlyph("company");
    }
  }

  function submit() {
    const nextGlyph =
      glyph ?? pickUnusedGlyph(books.map((book) => glyphForBook(book)));
    createBook(name, fields, nextGlyph);
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

        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">{t("newBook.icon")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("newBook.iconHint")}</p>
          <div className="book-glyph-grid mt-2">
            <button
              type="button"
              className="book-glyph-cell"
              data-active={glyph === null}
              onClick={() => setGlyph(null)}
              aria-label={t("newBook.iconAuto")}
              title={t("newBook.iconAuto")}
            >
              <span className="kind-icon kind-icon-book book-glyph-auto">
                <Shuffle />
              </span>
            </button>
            {BOOK_GLYPHS.map((id) => (
              <button
                key={id}
                type="button"
                className="book-glyph-cell"
                data-active={glyph === id}
                onClick={() => setGlyph(id)}
                aria-label={id}
                title={id}
              >
                <KindIcon kind="book" glyph={id} />
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
