const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("astra", {
  // Window controls
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  onMaximizeChange: (cb) => {
    ipcRenderer.on("window:maximizeChanged", (_e, val) => cb(val));
  },

  // Auth
  login: (email, password) => ipcRenderer.invoke("auth:login", { email, password }),
  logout: () => ipcRenderer.invoke("auth:logout"),
  getSession: () => ipcRenderer.invoke("auth:session"),
  getLicense: () => ipcRenderer.invoke("auth:getLicense"),

  // Store
  storeGet: (key) => ipcRenderer.invoke("store:get", key),
  storeSet: (key, value) => ipcRenderer.invoke("store:set", key, value),

  // System
  getSystemInfo: () => ipcRenderer.invoke("system:info"),

  // External
  openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),
  openPricing: () => ipcRenderer.invoke("shell:openPricing"),

  // Optimizations
  getOptimizeStatus: () => ipcRenderer.invoke("optimize:getStatus"),
  applyTweak: (id) => ipcRenderer.invoke("optimize:applyTweak", id),
  revertTweak: (id) => ipcRenderer.invoke("optimize:revertTweak", id),
  revertAll: () => ipcRenderer.invoke("optimize:revertAll"),
});
