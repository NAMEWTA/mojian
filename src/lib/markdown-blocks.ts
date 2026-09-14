const FENCE = /^```/;
const HEADING = /^#{1,6} /;
const RULE = /^(---|\*\*\*|___)\s*$/;
const LIST = /^\s*(?:[-*+] |\d+\. )/;
const QUOTE = /^>/;
const TABLE_SEP = /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/;

export function splitMarkdownBlocks(source: string): string[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].trim() === "") {
      i += 1;
      continue;
    }

    if (FENCE.test(lines[i])) {
      const chunk = [lines[i]];
      i += 1;
      while (i < lines.length) {
        chunk.push(lines[i]);
        if (FENCE.test(lines[i])) {
          i += 1;
          break;
        }
        i += 1;
      }
      blocks.push(chunk.join("\n"));
      continue;
    }

    if (HEADING.test(lines[i]) || RULE.test(lines[i])) {
      blocks.push(lines[i]);
      i += 1;
      continue;
    }

    if (lines[i].includes("|") && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const chunk = [lines[i], lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        chunk.push(lines[i]);
        i += 1;
      }
      blocks.push(chunk.join("\n"));
      continue;
    }

    if (LIST.test(lines[i])) {
      const chunk = [lines[i]];
      i += 1;
      while (i < lines.length) {
        if (LIST.test(lines[i]) || /^\s{2,}\S/.test(lines[i])) {
          chunk.push(lines[i]);
          i += 1;
          continue;
        }
        break;
      }
      blocks.push(chunk.join("\n"));
      continue;
    }

    if (QUOTE.test(lines[i])) {
      const chunk = [lines[i]];
      i += 1;
      while (i < lines.length && QUOTE.test(lines[i])) {
        chunk.push(lines[i]);
        i += 1;
      }
      blocks.push(chunk.join("\n"));
      continue;
    }

    const chunk = [lines[i]];
    i += 1;
    while (i < lines.length && lines[i].trim() !== "") {
      if (
        FENCE.test(lines[i]) ||
        HEADING.test(lines[i]) ||
        RULE.test(lines[i]) ||
        LIST.test(lines[i]) ||
        QUOTE.test(lines[i])
      ) {
        break;
      }
      chunk.push(lines[i]);
      i += 1;
    }
    blocks.push(chunk.join("\n"));
  }

  return blocks.length ? blocks : [""];
}

export function joinMarkdownBlocks(blocks: string[]): string {
  return blocks.join("\n\n");
}

export function blockKind(text: string): "h1" | "h2" | "h3" | "quote" | "code" | "list" | "p" {
  if (/^# /m.test(text) && !text.includes("\n")) return "h1";
  if (/^## /m.test(text) && !text.includes("\n")) return "h2";
  if (/^### /m.test(text) && !text.includes("\n")) return "h3";
  if (QUOTE.test(text)) return "quote";
  if (FENCE.test(text)) return "code";
  if (LIST.test(text)) return "list";
  return "p";
}

export function imageMarkdown(text: string): string {
  const matches = text.match(/!\[[^\]]*]\([^)]+\)/g);
  return matches ? matches.join("\n\n") : "";
}

export function toggleTaskAt(block: string, index: number): string {
  let seen = 0;
  return block.replace(/- \[([ xX])] /g, (full, mark: string) => {
    if (seen++ !== index) return full;
    return mark === " " ? "- [x] " : "- [ ] ";
  });
}
