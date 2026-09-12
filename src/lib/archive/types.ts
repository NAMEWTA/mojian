export const FIELD_TYPES = [
  { id: "text", label: "文本" },
  { id: "phone", label: "电话" },
  { id: "email", label: "邮箱" },
  { id: "url", label: "链接" },
  { id: "date", label: "日期" },
  { id: "select", label: "选项" },
  { id: "relation", label: "关联" },
] as const;

export type FieldType = (typeof FIELD_TYPES)[number]["id"];

export type FieldDef = {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  relationBookId?: string;
};

export type Book = {
  id: string;
  name: string;
  fields: FieldDef[];
  createdAt: number;
  updatedAt: number;
};

export type Entry = {
  id: string;
  bookId: string;
  title: string;
  values: Record<string, string>;
  createdAt: number;
  updatedAt: number;
};

export type ArchiveNode = {
  id: string;
  entryId: string;
  parentId: string | null;
  kind: "folder" | "file";
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

export type FocusKind = "book" | "entry" | "folder" | "file";

export function blankField(partial: Partial<FieldDef> = {}): FieldDef {
  return {
    id: crypto.randomUUID(),
    label: "新字段",
    type: "text",
    ...partial,
  };
}

export const PEOPLE_FIELD_TEMPLATE: Array<Omit<FieldDef, "id">> = [
  { label: "电话", type: "phone" },
  { label: "邮箱", type: "email" },
  { label: "身份", type: "text" },
  { label: "认识途径", type: "select", options: ["朋友介绍", "工作往来", "活动偶遇", "旧识"] },
];

export const COMPANY_FIELD_TEMPLATE: Array<Omit<FieldDef, "id">> = [
  { label: "行业", type: "text" },
  { label: "官网", type: "url" },
  { label: "电话", type: "phone" },
  { label: "地址", type: "text" },
];
