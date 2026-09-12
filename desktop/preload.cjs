const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mojianDesktop", {
  isDesktop: true,
  platform: process.platform,
  pickDirectory: () => ipcRenderer.invoke("vault:pick"),
  getDataDir: () => ipcRenderer.invoke("vault:getDir"),
  readData: () => ipcRenderer.invoke("vault:read"),
  writeData: (json) => ipcRenderer.invoke("vault:write", json),
});
