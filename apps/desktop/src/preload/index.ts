import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import type { OptimizationResult, SystemOverview } from "../main/types";

const astraApi = {
  getConfig: () => ipcRenderer.invoke("app:get-config") as Promise<{ apiBaseUrl: string; lastUserEmail?: string }>,
  setToken: (token: string | null, email?: string) => ipcRenderer.invoke("app:set-token", token, email) as Promise<boolean>,
  getToken: () => ipcRenderer.invoke("app:get-token") as Promise<string | null>,
  getSystemOverview: () => ipcRenderer.invoke("system:get-overview") as Promise<SystemOverview>,
  isAdmin: () => ipcRenderer.invoke("system:is-admin") as Promise<boolean>,
  createRestorePoint: () => ipcRenderer.invoke("system:create-restore-point") as Promise<OptimizationResult>,
  runAction: (action: "cleanup" | "fps" | "services" | "registry" | "network" | "all") =>
    ipcRenderer.invoke("system:run-action", action) as Promise<OptimizationResult>,
  rollback: () => ipcRenderer.invoke("system:rollback") as Promise<OptimizationResult>,
  openExternal: (url: string) => ipcRenderer.invoke("shell:open-external", url) as Promise<boolean>,
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld("electron", electronAPI);
  contextBridge.exposeInMainWorld("astra", astraApi);
} else {
  // @ts-expect-error dev fallback
  window.electron = electronAPI;
  // @ts-expect-error dev fallback
  window.astra = astraApi;
}

export type AstraBridge = typeof astraApi;
