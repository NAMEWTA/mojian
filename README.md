# 墨笺

以档案为中心的桌面笔记。左侧是完整目录树：簿 → 档案 → 文件夹 / 文稿。Markdown 只是档案里的一种写法。

桌面端用 **Tauri 2**：系统 WebView + 很小的 Rust 壳，不打包 Chromium。

## 目录结构

1. **簿**：分类（人脉、企业、笔记…）。点簿名，右侧编辑这本簿的字段。
2. **档案**：簿下面的一条实体。点档案，右侧编辑属性。
3. **文件夹 / 文稿**：档案里面的文件树。点文稿，右侧撰写 Markdown。

数据默认写在「文档/墨笺/mojian.json」。也可以改绑到 iCloud、OneDrive、坚果云里的文件夹，换电脑后再选同一位置即可迁移。随时可导出 / 导入备份。

## 仓库布局

```
src/                 React 界面（网页预览与桌面端共用）
  components/        档案树、编辑器、设置
  lib/
    archive/         簿 / 档案 / 文稿状态
    desktop.ts       Tauri invoke 封装
    vault.ts         备份与目录绑定（浏览器 / 桌面）
  entry-desktop.tsx  桌面端静态入口
src-tauri/           Tauri 2
  src/vault.rs       选文件夹、读写 mojian.json
  capabilities/      ACL
  permissions/       自定义命令授权
desktop.html         桌面端 HTML 壳
```

## 网页预览

```bash
npm ci
npm run dev
```

## 桌面端（Windows x64 / Mac Apple Silicon）

需要 Node 22 和 [Rust](https://rustup.rs)。

开发（先起网页，再开原生窗口；`tauri dev` 会自己跑 `npm run dev`）：

```bash
npm run desktop
```

打包：

```bash
# 当前系统
npm run dist

# 指定目标（一般走 GitHub Actions）
npx tauri build --target x86_64-pc-windows-msvc
npx tauri build --target aarch64-apple-darwin
```

安装包在 `src-tauri/target/*/release/bundle/`。

- Windows：NSIS `.exe`
- Mac：`.dmg`（Apple Silicon）

Mac 未签名时，第一次打开请到「系统设置 → 隐私与安全性」选择仍要打开。Windows 可能被 SmartScreen 拦截一次。

## GitHub CI / CD

推送到 `main` 会跑类型检查、网页构建、桌面前端静态构建，以及 `cargo fmt`。

打一个版本标签即会同时打 Windows x64 与 Mac arm64 安装包，并挂到 GitHub Release：

```bash
git tag v0.0.1
git push origin v0.0.1
```

也可以在 Actions 里手动跑 **Release desktop**。

## 技术

React 19、TanStack Start（网页）、Vite 静态包（桌面）、Zustand、Tauri 2、Rust。
