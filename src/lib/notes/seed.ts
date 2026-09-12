import type { Note } from "./types";

/** Fixed clock so SSR and the first client paint agree. */
const NOW = Date.parse("2026-09-11T22:00:00.000Z");

export const SEED_NOTES: Note[] = [
  {
    id: "seed-welcome",
    createdAt: NOW - 1000 * 60 * 8,
    updatedAt: NOW - 1000 * 60 * 8,
    content: `# 欢迎来到墨笺

墨笺是一款安静的笔记工具。没有时间线，没有社交，只有纸与字。

## 开始

- 点左侧「新建」或按快捷键写下新笔记
- 标题取自正文的第一行
- 内容自动保存在这台设备上
- 点右上角「预览」查看 Markdown 排版

按 \`?\` 查看全部快捷键。删除、搜索、上下切换都可以只用键盘完成。

祝你写得慢一点，也写得清楚一点。
`,
  },
  {
    id: "seed-markdown",
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

## 代码

\`\`\`ts
const note = { title: "墨笺", saved: true }
\`\`\`
`,
  },
  {
    id: "seed-essay",
    createdAt: NOW - 1000 * 60 * 60 * 50,
    updatedAt: NOW - 1000 * 60 * 60 * 50,
    content: `# 雨停之后

巷口的槐树还在滴水。伞收在门边，窗开了一线。桌上只留一盏灯，和一句还没写完的话。

不必写得漂亮。先写下来，让它在纸上待一会儿。

有些句子过夜之后会自己站稳，有些则在天亮时悄悄离开。两种都好。
`,
  },
];
