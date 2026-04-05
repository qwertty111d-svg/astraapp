const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Store = require("electron-store");

// ─── Config ───
const API_BASE = (() => {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    if (fs.existsSync(envPath)) {
      const env = fs.readFileSync(envPath, "utf-8");
      const match = env.match(/API_BASE_URL=(.+)/);
      if (match) return match[1].trim();
    }
  } catch {}
  return "https://astraboost.ru";
})();

const PRICING_URL = `${API_BASE}/pricing`;
const APP_VERSION = "2.4.0";

const store = new Store({
  name: "astra-desktop",
  defaults: {
    token: null,
    user: null,
    license: null,
    deviceFingerprint: null,
    theme: "dark",
    minimizeToTray: true,
    autoStart: false,
    appliedTweaks: [],
  },
});

// ─── Device fingerprint ───
function getDeviceFingerprint() {
  let fp = store.get("deviceFingerprint");
  if (!fp) {
    const os = require("os");
    const raw = `${os.hostname()}-${os.platform()}-${os.arch()}-${os.cpus()[0]?.model || "cpu"}`;
    fp = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
    store.set("deviceFingerprint", fp);
  }
  return fp;
}

function getDeviceName() {
  const os = require("os");
  return os.hostname() || "Astra Desktop";
}

// ─── API helpers ───
async function apiFetch(endpoint, options = {}) {
  const fetch = (await import("node-fetch")).default;
  const url = `${API_BASE}${endpoint}`;
  const token = store.get("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function apiLogin(email, password) {
  return apiFetch("/api/desktop/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      deviceName: getDeviceName(),
      deviceFingerprint: getDeviceFingerprint(),
      appVersion: APP_VERSION,
    }),
  });
}

async function apiGetSession() {
  return apiFetch("/api/desktop/session");
}

async function apiGetLicense() {
  return apiFetch("/api/desktop/license");
}

async function apiLogout() {
  return apiFetch("/api/desktop/logout", { method: "POST" });
}

// ─── Window ───
let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: "#09090b",
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", (e) => {
    if (store.get("minimizeToTray") && !app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "..", "build", "tray-icon.png");
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip("Astra");

  const contextMenu = Menu.buildFromTemplate([
    { label: "Открыть Astra", click: () => { mainWindow?.show(); } },
    { type: "separator" },
    { label: "Сайт", click: () => { shell.openExternal(API_BASE); } },
    { label: "Тарифы", click: () => { shell.openExternal(PRICING_URL); } },
    { type: "separator" },
    {
      label: "Выход",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => { mainWindow?.show(); });
}

// ─── IPC Handlers ───
function setupIPC() {
  // Window controls
  ipcMain.handle("window:minimize", () => mainWindow?.minimize());
  ipcMain.handle("window:maximize", () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle("window:close", () => mainWindow?.close());
  ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized() ?? false);

  // Auth
  ipcMain.handle("auth:login", async (_e, { email, password }) => {
    try {
      const result = await apiLogin(email, password);
      if (result.ok && result.data?.token) {
        store.set("token", result.data.token);
        store.set("user", result.data.user);
        store.set("license", result.data.license);
        return { ok: true, user: result.data.user, license: result.data.license };
      }
      return { ok: false, error: result.data?.error || "Ошибка входа" };
    } catch (err) {
      return { ok: false, error: err.message || "Сервер недоступен" };
    }
  });

  ipcMain.handle("auth:logout", async () => {
    try { await apiLogout(); } catch {}
    store.delete("token");
    store.delete("user");
    store.delete("license");
    store.set("appliedTweaks", []);
    return { ok: true };
  });

  ipcMain.handle("auth:session", async () => {
    const token = store.get("token");
    if (!token) return { ok: false, authenticated: false };
    try {
      const result = await apiGetSession();
      if (result.ok && result.data?.authenticated) {
        store.set("user", result.data.user);
        store.set("license", result.data.license);
        return { ok: true, user: result.data.user, license: result.data.license, devices: result.data.devices };
      }
      store.delete("token");
      store.delete("user");
      store.delete("license");
      return { ok: false, authenticated: false };
    } catch {
      // Offline — use cached
      const user = store.get("user");
      const license = store.get("license");
      if (user) return { ok: true, user, license, offline: true };
      return { ok: false, authenticated: false };
    }
  });

  ipcMain.handle("auth:getLicense", async () => {
    try {
      const result = await apiGetLicense();
      if (result.ok) {
        store.set("license", result.data.license);
        return { ok: true, license: result.data.license };
      }
      return { ok: false };
    } catch {
      return { ok: true, license: store.get("license") };
    }
  });

  // Store
  ipcMain.handle("store:get", (_e, key) => store.get(key));
  ipcMain.handle("store:set", (_e, key, value) => { store.set(key, value); return true; });

  // System info
  ipcMain.handle("system:info", () => {
    const os = require("os");
    return {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || "Unknown",
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      osVersion: os.release(),
      appVersion: APP_VERSION,
    };
  });

  // External links
  ipcMain.handle("shell:openExternal", (_e, url) => shell.openExternal(url));
  ipcMain.handle("shell:openPricing", () => shell.openExternal(PRICING_URL));

  // Optimizations (real Windows tweaks via PowerShell)
  ipcMain.handle("optimize:getStatus", () => {
    return { appliedTweaks: store.get("appliedTweaks") || [] };
  });

  ipcMain.handle("optimize:applyTweak", async (_e, tweakId) => {
    // These will be real PowerShell commands on Windows
    const applied = store.get("appliedTweaks") || [];
    if (!applied.includes(tweakId)) {
      applied.push(tweakId);
      store.set("appliedTweaks", applied);
    }
    return { ok: true, appliedTweaks: applied };
  });

  ipcMain.handle("optimize:revertTweak", async (_e, tweakId) => {
    let applied = store.get("appliedTweaks") || [];
    applied = applied.filter((t) => t !== tweakId);
    store.set("appliedTweaks", applied);
    return { ok: true, appliedTweaks: applied };
  });

  ipcMain.handle("optimize:revertAll", async () => {
    store.set("appliedTweaks", []);
    return { ok: true, appliedTweaks: [] };
  });
}

// ─── App lifecycle ───
app.whenReady().then(() => {
  createWindow();
  createTray();
  setupIPC();

  mainWindow.on("maximize", () => mainWindow.webContents.send("window:maximizeChanged", true));
  mainWindow.on("unmaximize", () => mainWindow.webContents.send("window:maximizeChanged", false));
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", () => {
  app.isQuitting = true;
});
