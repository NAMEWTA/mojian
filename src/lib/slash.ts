export type SlashGroup = "basic" | "insert";

export type SlashId =
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "ordered"
  | "task"
  | "quote"
  | "code"
  | "table"
  | "divider"
  | "image";

export type SlashItem = {
  id: SlashId;
  group: SlashGroup;
  keywords: string[];
  markdown?: string;
  cursor?: number;
  image?: boolean;
};

export const SLASH_ITEMS: SlashItem[] = [
  { id: "h1", group: "basic", keywords: ["h1", "title", "heading", "标题"], markdown: "# ", cursor: 2 },
  { id: "h2", group: "basic", keywords: ["h2", "heading", "标题"], markdown: "## ", cursor: 3 },
  { id: "h3", group: "basic", keywords: ["h3", "heading", "标题"], markdown: "### ", cursor: 4 },
  { id: "bullet", group: "basic", keywords: ["ul", "list", "bullet", "无序", "列表"], markdown: "- ", cursor: 2 },
  {
    id: "ordered",
    group: "basic",
    keywords: ["ol", "numbered", "序号", "有序", "列表"],
    markdown: "1. ",
    cursor: 3,
  },
  {
    id: "task",
    group: "basic",
    keywords: ["todo", "task", "checkbox", "待办", "任务"],
    markdown: "- [ ] ",
    cursor: 6,
  },
  { id: "quote", group: "basic", keywords: ["quote", "blockquote", "引用"], markdown: "> ", cursor: 2 },
  {
    id: "code",
    group: "basic",
    keywords: ["code", "fence", "代码"],
    markdown: "```\n\n```",
    cursor: 4,
  },
  {
    id: "table",
    group: "insert",
    keywords: ["table", "grid", "表格"],
    markdown: "|  |  |\n| --- | --- |\n|  |  |\n",
    cursor: 2,
  },
  {
    id: "divider",
    group: "insert",
    keywords: ["hr", "divider", "separator", "分割", "分隔"],
    markdown: "---\n",
    cursor: 4,
  },
  {
    id: "image",
    group: "insert",
    keywords: ["image", "img", "png", "jpg", "upload", "图片", "上传"],
    image: true,
  },
];

export type SlashMatch = {
  start: number;
  end: number;
  query: string;
};

/** `/` at the start of a line (optional indent), like Notion / OpenKnowledge. */
export function matchSlash(value: string, caret: number): SlashMatch | null {
  if (caret < 1) return null;
  const before = value.slice(0, caret);
  const lineStart = before.lastIndexOf("\n") + 1;
  const line = before.slice(lineStart);
  const found = /^(\s*)\/([^\s]*)$/.exec(line);
  if (!found) return null;
  const start = lineStart + found[1].length;
  return { start, end: caret, query: found[2] };
}

export function filterSlashItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter((item) => {
    if (item.id.includes(q)) return true;
    return item.keywords.some((word) => word.toLowerCase().includes(q) || q.includes(word.toLowerCase()));
  });
}

export function applySlashItem(
  value: string,
  match: SlashMatch,
  item: SlashItem,
): { next: string; caret: number } {
  if (item.image) {
    const next = `${value.slice(0, match.start)}${value.slice(match.end)}`;
    return { next, caret: match.start };
  }
  const markdown = item.markdown ?? "";
  const next = `${value.slice(0, match.start)}${markdown}${value.slice(match.end)}`;
  return { next, caret: match.start + (item.cursor ?? markdown.length) };
}
