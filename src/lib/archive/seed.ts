import type { ArchiveNode, Book, Entry } from "./types";

const NOW = Date.parse("2026-09-14T06:00:00.000Z");

export const BOOK_DEMO = "book-demo";
export const ENTRY_DEMO = "entry-demo";
export const FOLDER_DEMO = "folder-demo";
export const DOC_START = "doc-start";

export const SEED_BOOKS: Book[] = [
  {
    id: BOOK_DEMO,
    name: "演示簿",
    createdAt: NOW - 1000 * 60 * 30,
    updatedAt: NOW - 1000 * 60 * 4,
    glyph: "notes",
    fields: [
      { id: "d-role", label: "身份", type: "text" },
      { id: "d-phone", label: "电话", type: "phone" },
      {
        id: "d-note",
        label: "备注",
        type: "select",
        options: ["仅作示范", "可以改", "可以删"],
      },
    ],
  },
];

export const SEED_ENTRIES: Entry[] = [
  {
    id: ENTRY_DEMO,
    bookId: BOOK_DEMO,
    title: "演示档案",
    createdAt: NOW - 1000 * 60 * 20,
    updatedAt: NOW - 1000 * 60 * 4,
    values: {
      "d-role": "第一次打开时的示例",
      "d-phone": "",
      "d-note": "仅作示范",
    },
  },
];

export const SEED_DOCS: ArchiveNode[] = [
  {
    id: DOC_START,
    entryId: ENTRY_DEMO,
    parentId: null,
    kind: "file",
    name: "01 · 从这里开始",
    createdAt: NOW - 1000 * 60 * 12,
    updatedAt: NOW - 1000 * 60 * 4,
    content: `# 从这里开始

欢迎使用墨笺。第一次打开，只准备了这一本**演示簿**、一条**演示档案**、一个**演示文件夹**，以及这几篇说明。看完之后，整本簿都可以删掉，换成你自己的。

墨笺不是一叠散落的笔记。左边是一棵完整的目录：

**簿 → 档案 → 文件夹 / 文稿**

| 你看到的 | 点它会怎样 |
| --- | --- |
| 深色**方块** | 一本簿。右侧编辑这本簿的字段 |
| **圆形** | 一条档案。右侧填写属性，并看到它下面的文稿树 |
| **琥珀色文件夹** | 一层目录。可以再放文件夹或文稿 |
| **灰色纸张** | 一篇 Markdown 文稿。右侧撰写 |

![左侧目录树：簿、档案、文件夹、文稿](/demo/tree.png)

## 建议你这样走一遍

1. 点左侧的 **演示簿**，看字段是怎么定的。
2. 再点 **演示档案**，看档案属性和下面的文稿树。
3. 打开 **演示文件夹**，按 02、03、04 的顺序读完。

右侧这篇就是文稿。默认是**实时预览编辑**：标题、列表、图片直接显示在正文里，点某一段就能改。顶栏可以切到「仅预览」。行首输入 \`/\` 能插入标题、列表或图片。
`,
  },
  {
    id: FOLDER_DEMO,
    entryId: ENTRY_DEMO,
    parentId: null,
    kind: "folder",
    name: "演示文件夹",
    content: "",
    createdAt: NOW - 1000 * 60 * 11,
    updatedAt: NOW - 1000 * 60 * 4,
  },
  {
    id: "doc-book",
    entryId: ENTRY_DEMO,
    parentId: FOLDER_DEMO,
    kind: "file",
    name: "02 · 簿、档案、字段",
    createdAt: NOW - 1000 * 60 * 10,
    updatedAt: NOW - 1000 * 60 * 4,
    content: `# 簿、档案、字段

## 簿是分类

人脉、企业、项目、读书……每一种分类就是一本**簿**。左下角 **新建簿**，也可以从「人脉 / 企业 / 笔记」模板开始。新建时可以选一个图标；不选的话，会随机分配一个还没用过的。

点簿的名字（不要点它旁边的加号），右侧会打开这本簿：

![点开演示簿，编辑字段、查看档案列表](/demo/book.png)

在这里可以：

- 给整本簿**增加、删除、调整字段**（文本、电话、邮箱、链接、日期、选项、关联）
- 看到这本簿里的所有档案
- 点某一行，进入那条档案

字段是簿的模板：你在这里加一个「电话」，这本簿里每一条档案都会带上电话。

## 档案是一条记录

档案像一个文件夹。它有名字、有字段值，里面再放文稿。

点左侧 **演示档案**，右侧分成两块：**档案属性** 和 **文稿**。

![演示档案：上面是属性，下面是文稿树](/demo/entry.png)

- 改标题、改字段，都只影响这一条
- 下面的文稿树和左侧目录是同一棵，只是缩到了这条档案里
- 顶栏垃圾桶会删除整条档案（连同里面的文件）

演示档案里的「身份 / 电话 / 备注」都可以改着玩。改完不会弄坏别的东西。
`,
  },
  {
    id: "doc-files",
    entryId: ENTRY_DEMO,
    parentId: FOLDER_DEMO,
    kind: "file",
    name: "03 · 文件夹与文稿",
    createdAt: NOW - 1000 * 60 * 9,
    updatedAt: NOW - 1000 * 60 * 4,
    content: `# 文件夹与文稿

档案里面可以再分层，跟电脑里的文件夹一样。

## 文稿树

在档案页点 **文件夹** 或 **文档**，会在当前层新建。左侧树里，把鼠标移到一行上：

- **+** 新建文档
- 文件夹图标 新建子文件夹
- **×** 删除（文件夹会连同里面的内容一起删，会先请你确认）

点开一个文件夹，右侧就是这一层：

![演示文件夹](/demo/folder.png)

## 写文稿

点一篇文稿进入编辑。默认是**实时预览编辑**（和 Typora、OpenKnowledge 一类开源编辑器相同的习惯）：正文按渲染后的样子呈现，点某一段就在原位修改。图片、标题、表格会直接显示。顶栏可以切到「仅预览」。

![文稿编辑](/demo/editor.png)

行首单独输入 \`/\`，会弹出命令菜单：

- 标题一 / 二 / 三
- 无序列表、有序列表、待办
- 引用、代码块
- 表格、分割线
- 上传图片

用 ↑ ↓ 选择，Enter 或 Tab 插入，Esc 取消。也可以继续输入过滤，例如 \`/h2\`、\`/序号\`、\`/upload\`。

常用写法也可以手打：

\`\`\`md
# 标题
**加粗**  *斜体*  \`代码\`

- 列表
- [ ] 待办

> 引用
\`\`\`

粘贴或拖入的图片会立刻出现在这段文字下面。点最后一段下面的空白，就可以继续写。

![文稿预览](/demo/preview.png)

Tab 会插入两个空格。内容会自动保存。
`,
  },
  {
    id: "doc-more",
    entryId: ENTRY_DEMO,
    parentId: FOLDER_DEMO,
    kind: "file",
    name: "04 · 图片、语言、备份",
    createdAt: NOW - 1000 * 60 * 8,
    updatedAt: NOW - 1000 * 60 * 4,
    content: `# 图片、语言、备份

## 把图片放进文稿

在编辑里 **粘贴**、**拖入** PNG / JPG，点顶栏的图片按钮，或行首输入 \`/\` 再选「上传图片」。

图片会复制到数据目录下的 \`assets/\`，文件名是当天日期加编号，例如：

\`assets/2026-09-14-8f3a….png\`

文稿里写成相对路径：

\`\`\`md
![](assets/2026-09-14-8f3a….png)
\`\`\`

不要把原图路径写进去——墨笺用的是复制后的那一份。

## 语言

顶栏 **中 / EN** 切换界面语言。你自己写的簿名、档案、正文不会被翻译。

## 数据放在哪

电脑端默认写在 **Documents/mojian**：

- \`mojian.json\` 全部档案
- \`assets/\` 文稿里的图片

点顶栏硬盘图标打开「数据与备份」：

![数据与备份](/demo/backup.png)

- 可以改绑到 iCloud、OneDrive、坚果云里的文件夹，换电脑后再选同一位置
- **导出备份 / 导入备份** 适合拷到 U 盘
- **定时备份** 会按时间把快照写到指定目录（电脑端默认是数据文件夹下的 \`backups/\`）
- 打开程序时默认先备份一次；也可以改成每小时、每天等周期
- 滚动保留：只留最近 5 / 30 份，或限制总大小，超出就删最早的

文件名都是 \`mojian-backup-2026-09-14-142533.json\` 这种格式。

## 新建你自己的簿

左下角 **新建簿**。可以从空白、笔记、人脉、企业模板开始，再改字段。

![新建一本簿](/demo/new-book.png)

## 看完就可以删演示

这篇和这本「演示簿」只是路标。点簿名右侧的垃圾桶，整本演示都会消失。然后从你真正要记的人、项目或笔记开始即可。
`,
  },
];
