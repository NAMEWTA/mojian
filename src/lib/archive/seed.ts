import type { ArchiveNode, Book, Entry } from "./types";

const NOW = Date.parse("2026-09-12T03:00:00.000Z");

export const BOOK_NOTES = "book-notes";
export const BOOK_PEOPLE = "book-people";
export const BOOK_COMPANY = "book-company";

export const SEED_BOOKS: Book[] = [
  {
    id: BOOK_NOTES,
    name: "笔记簿",
    createdAt: NOW - 1000 * 60 * 60 * 50,
    updatedAt: NOW - 1000 * 60 * 8,
    fields: [],
  },
  {
    id: BOOK_PEOPLE,
    name: "人脉簿",
    createdAt: NOW - 1000 * 60 * 60 * 40,
    updatedAt: NOW - 1000 * 60 * 20,
    fields: [
      { id: "p-phone", label: "电话", type: "phone" },
      { id: "p-email", label: "邮箱", type: "email" },
      { id: "p-role", label: "身份", type: "text" },
      {
        id: "p-company",
        label: "所属企业",
        type: "relation",
        relationBookId: BOOK_COMPANY,
      },
      {
        id: "p-how",
        label: "认识途径",
        type: "select",
        options: ["朋友介绍", "工作往来", "活动偶遇", "旧识"],
      },
    ],
  },
  {
    id: BOOK_COMPANY,
    name: "企业簿",
    createdAt: NOW - 1000 * 60 * 60 * 40,
    updatedAt: NOW - 1000 * 60 * 30,
    fields: [
      { id: "c-industry", label: "行业", type: "text" },
      { id: "c-site", label: "官网", type: "url" },
      { id: "c-phone", label: "电话", type: "phone" },
      { id: "c-address", label: "地址", type: "text" },
    ],
  },
];

export const SEED_ENTRIES: Entry[] = [
  {
    id: "entry-welcome",
    bookId: BOOK_NOTES,
    title: "欢迎来到墨笺",
    createdAt: NOW - 1000 * 60 * 8,
    updatedAt: NOW - 1000 * 60 * 8,
    values: {},
  },
  {
    id: "entry-markdown",
    bookId: BOOK_NOTES,
    title: "Markdown 速记",
    createdAt: NOW - 1000 * 60 * 60 * 26,
    updatedAt: NOW - 1000 * 60 * 60 * 26,
    values: {},
  },
  {
    id: "entry-rain",
    bookId: BOOK_NOTES,
    title: "雨停之后",
    createdAt: NOW - 1000 * 60 * 60 * 50,
    updatedAt: NOW - 1000 * 60 * 60 * 50,
    values: {},
  },
  {
    id: "entry-chen",
    bookId: BOOK_PEOPLE,
    title: "陈晚晴",
    createdAt: NOW - 1000 * 60 * 60 * 26,
    updatedAt: NOW - 1000 * 60 * 18,
    values: {
      "p-phone": "138 0100 2288",
      "p-email": "wanqing@chaguang.example",
      "p-role": "茶席主理",
      "p-company": "entry-chaguang",
      "p-how": "朋友介绍",
    },
  },
  {
    id: "entry-zhou",
    bookId: BOOK_PEOPLE,
    title: "周屿",
    createdAt: NOW - 1000 * 60 * 60 * 20,
    updatedAt: NOW - 1000 * 60 * 50,
    values: {
      "p-phone": "186 2210 0941",
      "p-email": "zhouyu@beichuang.example",
      "p-role": "文学编辑",
      "p-company": "entry-beichuang",
      "p-how": "工作往来",
    },
  },
  {
    id: "entry-chaguang",
    bookId: BOOK_COMPANY,
    title: "晨光茶社",
    createdAt: NOW - 1000 * 60 * 60 * 30,
    updatedAt: NOW - 1000 * 60 * 40,
    values: {
      "c-industry": "茶事 / 空间",
      "c-site": "https://chaguang.example",
      "c-phone": "010 6588 1020",
      "c-address": "东城区北新桥小街 12 号",
    },
  },
  {
    id: "entry-beichuang",
    bookId: BOOK_COMPANY,
    title: "北窗出版社",
    createdAt: NOW - 1000 * 60 * 60 * 28,
    updatedAt: NOW - 1000 * 60 * 80,
    values: {
      "c-industry": "出版",
      "c-site": "https://beichuang.example",
      "c-phone": "010 6400 3312",
      "c-address": "西城区砖塔胡同 8 号",
    },
  },
];

export const SEED_DOCS: ArchiveNode[] = [
  {
    id: "doc-welcome",
    entryId: "entry-welcome",
    parentId: null,
    kind: "file",
    name: "正文",
    createdAt: NOW - 1000 * 60 * 8,
    updatedAt: NOW - 1000 * 60 * 8,
    content: `# 欢迎来到墨笺

墨笺以档案为中心。左侧是完整目录树：簿、档案、文件夹和文稿。Markdown 只是档案里的一种写法。

## 目录怎么用

- 点簿：看这本簿的字段和条目
- 点档案：看这条档案的属性
- 点文稿：在右侧撰写

数据可以绑到本机文件夹，或导出备份。电脑端（Windows / Mac）会把同一份档案写到你指定的目录。
`,
  },
  {
    id: "doc-markdown",
    entryId: "entry-markdown",
    parentId: null,
    kind: "file",
    name: "速记",
    createdAt: NOW - 1000 * 60 * 60 * 26,
    updatedAt: NOW - 1000 * 60 * 60 * 26,
    content: `# Markdown 速记

用轻量标记把结构写清楚，预览开关随时可开。

## 强调

**加粗**、*斜体*，以及 \`行内代码\`。

## 列表

- 晨间三件事
- 待读清单

1. 起草
2. 修改
3. 放下

## 任务

- [x] 打开墨笺
- [ ] 写下今天的第一句

## 引用

> 写，是为了看清自己在想什么。
`,
  },
  {
    id: "doc-rain",
    entryId: "entry-rain",
    parentId: null,
    kind: "file",
    name: "正文",
    createdAt: NOW - 1000 * 60 * 60 * 50,
    updatedAt: NOW - 1000 * 60 * 60 * 50,
    content: `# 雨停之后

巷口的槐树还在滴水。伞收在门边，窗开了一线。桌上只留一盏灯，和一句还没写完的话。

不必写得漂亮。先写下来，让它在纸上待一会儿。

有些句子过夜之后会自己站稳，有些则在天亮时悄悄离开。两种都好。
`,
  },
  {
    id: "folder-chen-wanglai",
    entryId: "entry-chen",
    parentId: null,
    kind: "folder",
    name: "往来",
    content: "",
    createdAt: NOW - 1000 * 60 * 60 * 25,
    updatedAt: NOW - 1000 * 60 * 18,
  },
  {
    id: "doc-chen-meet",
    entryId: "entry-chen",
    parentId: "folder-chen-wanglai",
    kind: "file",
    name: "初识",
    createdAt: NOW - 1000 * 60 * 60 * 24,
    updatedAt: NOW - 1000 * 60 * 18,
    content: `# 初识

在北新桥那间小茶室见面。她把水烧到刚好，不说话，先把杯子温热。

记下两件事：

- 不喜欢被称作「老板」，称「晚晴」即可
- 下次带一本北窗出的诗集，她说想给空间做一份季节书单
`,
  },
  {
    id: "doc-chen-collab",
    entryId: "entry-chen",
    parentId: "folder-chen-wanglai",
    kind: "file",
    name: "合作备忘",
    createdAt: NOW - 1000 * 60 * 40,
    updatedAt: NOW - 1000 * 60 * 18,
    content: `# 合作备忘

想在茶社做一次「纸与茶」小集：墨笺的读者坐下来写一段，她配一款岩茶。

待确认：

1. 周日下午场，大约十二人
2. 纸、笔由我准备
3. 她负责席位和茶
`,
  },
  {
    id: "doc-zhou",
    entryId: "entry-zhou",
    parentId: null,
    kind: "file",
    name: "约稿",
    createdAt: NOW - 1000 * 60 * 60 * 10,
    updatedAt: NOW - 1000 * 60 * 50,
    content: `# 约稿

周屿约一篇关于「慢写」的短文，两千字左右，给北窗的月报。

截稿大概在月底。她说不要鸡汤，要具体的纸面习惯。
`,
  },
  {
    id: "folder-chaguang",
    entryId: "entry-chaguang",
    parentId: null,
    kind: "folder",
    name: "空间",
    content: "",
    createdAt: NOW - 1000 * 60 * 60 * 14,
    updatedAt: NOW - 1000 * 60 * 40,
  },
  {
    id: "doc-chaguang",
    entryId: "entry-chaguang",
    parentId: "folder-chaguang",
    kind: "file",
    name: "空间印象",
    createdAt: NOW - 1000 * 60 * 60 * 12,
    updatedAt: NOW - 1000 * 60 * 40,
    content: `# 空间印象

一进门是槐木长桌。午后光线从北窗进来，很适合坐下来写。

周末有时满座，约人最好提前一天。
`,
  },
  {
    id: "doc-beichuang",
    entryId: "entry-beichuang",
    parentId: null,
    kind: "file",
    name: "往来",
    createdAt: NOW - 1000 * 60 * 60 * 8,
    updatedAt: NOW - 1000 * 60 * 80,
    content: `# 往来

北窗的月报走纸质，发行量不大，编辑部的人却很认真。

寄样书地址用企业簿里的砖塔胡同。
`,
  },
];
