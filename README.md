# 墨笺

以档案为中心的桌面笔记。左侧是完整目录树：簿 → 档案 → 文件夹 / 文稿。Markdown 只是档案里的一种写法。

## 目录结构

1. **簿**：分类（人脉、企业、笔记…）。点簿名，右侧编辑这本簿的字段。
2. **档案**：簿下面的一条实体。点档案，右侧编辑属性。
3. **文件夹 / 文稿**：档案里面的文件树。点文稿，右侧撰写 Markdown。

数据默认写在「文档/墨笺/mojian.json」。也可以改绑到 iCloud、OneDrive、坚果云里的文件夹，换电脑后再选同一位置即可迁移。随时可导出 / 导入备份。

## 网页预览

```bash
npm ci
npm run dev
```

## 桌面端（Windows x64 / Mac Apple Silicon）

需要 Node 22。

开发时先开网页服务，再开 Electron 窗口：

```bash
npm run dev
npm run desktop
```

打包（在对应系统上，或走 GitHub Actions）：

```bash
# Windows x64
set MOJIAN_DESKTOP=1
npm run dist -- --win --x64

# macOS Apple Silicon
MOJIAN_DESKTOP=1 npm run dist -- --mac --arm64
```

安装包会出现在 `release/`。

- Windows：`墨笺-1.0.0-windows-x64.exe`
- Mac：`墨笺-1.0.0-mac-arm64.dmg`

Mac 未签名时，第一次打开请到「系统设置 → 隐私与安全性」选择仍要打开。Windows 可能被 SmartScreen 拦截一次。

## GitHub CI / CD

推送到 `main` 会跑类型检查和网页构建。

打一个版本标签即会同时打 Windows 与 Mac 安装包，并挂到 GitHub Release：

```bash
git tag v1.0.0
git push origin v1.0.0
```

也可以在 Actions 里手动跑 **Release desktop**。

## 技术

React 19、TanStack Start、Zustand、Electron、electron-builder。
