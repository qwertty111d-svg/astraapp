import { app, BrowserWindow } from "electron";
import path from "node:path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { registerIpcHandlers } from "./ipc";

/** Creates the main Astra desktop window. */
function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1260,
    minHeight: 820,
    backgroundColor: "#02030a",
    title: "Astra Desktop",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  registerIpcHandlers(window);

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  return window;
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.astra.desktop");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
