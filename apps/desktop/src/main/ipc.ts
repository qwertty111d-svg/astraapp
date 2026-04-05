import { BrowserWindow, ipcMain, shell } from "electron";
import { appStore } from "./store";
import { getSystemOverview, isRunningAsAdmin } from "./optimizer/system";
import {
  createRestorePoint,
  cleanupJunk,
  applyFpsProfile,
  optimizeAll,
  optimizeNetwork,
  optimizeRegistry,
  optimizeServices,
  rollbackLastSnapshot,
} from "./optimizer/actions";

const ACTION_MAP = {
  cleanup: cleanupJunk,
  fps: applyFpsProfile,
  services: optimizeServices,
  registry: optimizeRegistry,
  network: optimizeNetwork,
  all: optimizeAll,
};

/** Registers the preload IPC contract used by React. */
export function registerIpcHandlers(_mainWindow: BrowserWindow): void {
 ipcMain.handle("app:get-config", async () => ({
  apiBaseUrl: process.env.API_BASE_URL ?? "https://astraboost.ru",
  lastUserEmail: appStore.get("lastUserEmail"),
}));
  ipcMain.handle("app:set-token", async (_event, token: string | null, email?: string) => {
    if (token) appStore.set("authToken", token);
    else appStore.delete("authToken");
    if (email) appStore.set("lastUserEmail", email);
    return true;
  });

  ipcMain.handle("app:get-token", async () => appStore.get("authToken") ?? null);
  ipcMain.handle("system:get-overview", async () => getSystemOverview());
  ipcMain.handle("system:is-admin", async () => isRunningAsAdmin());
  ipcMain.handle("system:create-restore-point", async () => createRestorePoint());
  ipcMain.handle("system:run-action", async (_event, action: keyof typeof ACTION_MAP) => ACTION_MAP[action]());
  ipcMain.handle("system:rollback", async () => rollbackLastSnapshot());
  ipcMain.handle("shell:open-external", async (_event, url: string) => {
    await shell.openExternal(url);
    return true;
  });
}
