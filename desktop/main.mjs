import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP_PORT = Number(process.env.MOJIAN_PORT || 17821);
const META_NAME = "vault.json";

function metaPath() {
  return path.join(app.getPath("userData"), META_NAME);
}

function defaultLibrary() {
  return path.join(app.getPath("documents"), "墨笺");
}

function readMeta() {
  try {
    return JSON.parse(readFileSync(metaPath(), "utf8"));
  } catch {
    return {};
  }
}

function writeMeta(patch) {
  const next = { ...readMeta(), ...patch };
  mkdirSync(app.getPath("userData"), { recursive: true });
  writeFileSync(metaPath(), `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

function dataFile() {
  const dir = readMeta().dataDir || defaultLibrary();
  mkdirSync(dir, { recursive: true });
  return path.join(dir, "mojian.json");
}

function createWindow(url) {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#f4f0e6",
    title: "墨笺",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });
  win.once("ready-to-show", () => win.show());
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    void shell.openExternal(target);
    return { action: "deny" };
  });
  void win.loadURL(url);
  return win;
}

function waitForServer(url, tries = 50) {
  return new Promise((resolve, reject) => {
    const tick = (left) => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(url);
      });
      req.on("error", () => {
        if (left <= 0) reject(new Error("桌面服务没有启动"));
        else setTimeout(() => tick(left - 1), 200);
      });
    };
    tick(tries);
  });
}

function startPackagedServer() {
  const serverRoot = path.join(process.resourcesPath, "server");
  const entry = path.join(serverRoot, "server", "index.mjs");
  if (!existsSync(entry)) {
    throw new Error(`找不到桌面服务：${entry}`);
  }
  const child = spawn(process.execPath, [entry], {
    cwd: serverRoot,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      PORT: String(DESKTOP_PORT),
      NITRO_PORT: String(DESKTOP_PORT),
      HOST: "127.0.0.1",
      NITRO_HOST: "127.0.0.1",
    },
    stdio: "pipe",
  });
  child.stdout?.on("data", (buf) => process.stdout.write(buf));
  child.stderr?.on("data", (buf) => process.stderr.write(buf));
  app.on("before-quit", () => {
    child.kill();
  });
  return `http://127.0.0.1:${DESKTOP_PORT}/`;
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac
      ? [{ role: "appMenu" }]
      : [{ label: "墨笺", submenu: [{ role: "quit", label: "退出" }] }]),
    {
      label: "文件",
      submenu: [
        {
          label: "选择数据文件夹…",
          click: async (_item, win) => {
            const dir = await pickDir();
            if (dir && win) win.webContents.send("vault:changed", dir);
          },
        },
        { type: "separator" },
        isMac ? { role: "close", label: "关闭窗口" } : { role: "quit", label: "退出" },
      ],
    },
    { role: "editMenu", label: "编辑" },
    { role: "viewMenu", label: "查看" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function pickDir() {
  const result = await dialog.showOpenDialog({
    title: "选择墨笺数据文件夹",
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const dir = result.filePaths[0];
  writeMeta({ dataDir: dir });
  mkdirSync(dir, { recursive: true });
  return dir;
}

function registerIpc() {
  ipcMain.handle("vault:pick", () => pickDir());
  ipcMain.handle("vault:getDir", () => {
    const dir = readMeta().dataDir || defaultLibrary();
    mkdirSync(dir, { recursive: true });
    if (!readMeta().dataDir) writeMeta({ dataDir: dir });
    return dir;
  });
  ipcMain.handle("vault:read", () => {
    const file = dataFile();
    if (!existsSync(file)) return null;
    return readFileSync(file, "utf8");
  });
  ipcMain.handle("vault:write", (_event, json) => {
    const file = dataFile();
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, json);
  });
}

app.whenReady().then(async () => {
  registerIpc();
  buildMenu();
  const devUrl = process.env.MOJIAN_DEV_URL || (!app.isPackaged ? "http://127.0.0.1:8080/" : null);
  const url = devUrl ?? startPackagedServer();
  if (!devUrl) await waitForServer(url);
  createWindow(url);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(url);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
