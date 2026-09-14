import { Menu, Plus, Trash2 } from "lucide-react";
import { FieldListEditor } from "@/components/archive/field-list-editor";
import { KindIcon } from "@/components/archive/kind-icon";
import { Button } from "@/components/ui/button";
import { formatLastEdited } from "@/lib/notes/format";
import { entryTitle, useArchiveStore } from "@/lib/archive/store";
import type { Book, Entry } from "@/lib/archive/types";
import { glyphForBook } from "@/lib/archive/types";
import { useI18n } from "@/i18n";

function fieldPreview(
  book: Book,
  entry: Entry,
  fieldId: string,
  allEntries: Entry[],
  empty: string,
): string {
  const field = book.fields.find((item) => item.id === fieldId);
  const raw = entry.values[fieldId] ?? "";
  if (!field || !raw) return empty;
  if (field.type === "relation") {
    const related = allEntries.find((item) => item.id === raw);
    return related ? entryTitle(related) : empty;
  }
  return raw;
}

export function BookView({
  now,
  onOpenSidebar,
  onCreateEntry,
  onDeleteBook,
}: {
  now: number;
  onOpenSidebar: () => void;
  onCreateEntry: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
}) {
  const { t, locale } = useI18n();
  const books = useArchiveStore((s) => s.books);
  const entries = useArchiveStore((s) => s.entries);
  const selectedBookId = useArchiveStore((s) => s.selectedBookId);
  const selectEntry = useArchiveStore((s) => s.selectEntry);
  const setFields = useArchiveStore((s) => s.setFields);
  const book = books.find((item) => item.id === selectedBookId) ?? null;

  if (!book) {
    return (
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center bg-background px-6 text-center">
        <p className="font-serif text-2xl tracking-tight">{t("book.emptyTitle")}</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("book.emptyHint")}</p>
      </section>
    );
  }

  const rows = entries
    .filter((entry) => entry.bookId === book.id)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const columns = book.fields.slice(0, 4);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex items-center gap-2 border-b border-hairline px-3 py-2 md:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenSidebar}
          aria-label={t("nav.openTree")}
        >
          <Menu />
        </Button>
        <KindIcon kind="book" glyph={glyphForBook(book)} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-serif text-lg font-semibold tracking-tight md:text-xl">
            {book.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("book.meta", { fields: book.fields.length, entries: rows.length })}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDeleteBook(book.id)}
          aria-label={t("book.delete")}
        >
          <Trash2 />
        </Button>
        <Button
          type="button"
          className="hidden h-10 rounded-xl sm:inline-flex"
          onClick={() => onCreateEntry(book.id)}
        >
          <Plus />
          {t("book.newEntry")}
        </Button>
      </header>

      <div className="notes-scroll min-h-0 flex-1 overflow-auto">
        <div className="border-b border-hairline px-4 py-5 md:px-6">
          <h3 className="font-serif text-base font-semibold">{t("book.fieldsTitle")}</h3>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">{t("book.fieldsHint")}</p>
          <FieldListEditor
            fields={book.fields}
            books={books}
            excludeBookId={book.id}
            onChange={(fields) => setFields(book.id, fields)}
          />
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="font-serif text-xl">{t("book.noEntriesTitle")}</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("book.noEntriesHint")}</p>
            <Button type="button" className="mt-5 rounded-xl" onClick={() => onCreateEntry(book.id)}>
              <Plus />
              {t("book.firstEntry")}
            </Button>
          </div>
        ) : (
          <table className="w-full min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-hairline text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium md:px-6">{t("book.colName")}</th>
                {columns.map((field) => (
                  <th key={field.id} className="hidden px-4 py-3 font-medium md:table-cell">
                    {field.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium md:px-6">{t("book.colUpdated")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr
                  key={entry.id}
                  className="cursor-pointer border-b border-hairline hover:bg-accent/50"
                  onClick={() => selectEntry(entry.id)}
                >
                  <td className="px-4 py-3 font-medium md:px-6">{entryTitle(entry)}</td>
                  {columns.map((field) => (
                    <td
                      key={field.id}
                      className="hidden max-w-40 truncate px-4 py-3 text-muted-foreground md:table-cell"
                    >
                      {fieldPreview(book, entry, field.id, entries, t("book.emptyValue"))}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground md:px-6" suppressHydrationWarning>
                    {formatLastEdited(entry.updatedAt, now, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
