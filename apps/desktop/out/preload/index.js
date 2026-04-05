"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const astraApi = {
  getConfig: () => electron.ipcRenderer.invoke("app:get-config"),
  setToken: (token, email) => electron.ipcRenderer.invoke("app:set-token", token, email),
  getToken: () => electron.ipcRenderer.invoke("app:get-token"),
  getSystemOverview: () => electron.ipcRenderer.invoke("system:get-overview"),
  isAdmin: () => electron.ipcRenderer.invoke("system:is-admin"),
  createRestorePoint: () => electron.ipcRenderer.invoke("system:create-restore-point"),
  runAction: (action) => electron.ipcRenderer.invoke("system:run-action", action),
  rollback: () => electron.ipcRenderer.invoke("system:rollback"),
  openExternal: (url) => electron.ipcRenderer.invoke("shell:open-external", url)
};
if (process.contextIsolated) {
  electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
  electron.contextBridge.exposeInMainWorld("astra", astraApi);
} else {
  window.electron = preload.electronAPI;
  window.astra = astraApi;
}
