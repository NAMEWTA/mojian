import { escapeRegExp } from "@/lib/notes/format";

export function HighlightText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, "ig"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === needle.toLowerCase() ? (
          <mark
            key={`${part}-${index}`}
            className="rounded-sm bg-mark text-foreground"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}
