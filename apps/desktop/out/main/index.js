"use strict";
const electron = require("electron");
const path = require("node:path");
const utils = require("@electron-toolkit/utils");
const ElectronStore = require("electron-store");
const os = require("node:os");
const node_child_process = require("node:child_process");
const node_util = require("node:util");
const sudo = require("sudo-prompt");
const fs = require("node:fs/promises");
const StoreCtor = ElectronStore.default ?? ElectronStore;
const appStore = new StoreCtor({
  defaults: {
    apiBaseUrl: process.env.API_BASE_URL ?? "https://astraboost.ru"
  }
});
const execAsync = node_util.promisify(node_child_process.exec);
async function runPowerShell(script) {
  const { stdout, stderr } = await execAsync(
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"')}"`,
    { windowsHide: true, maxBuffer: 1024 * 1024 * 8 }
  );
  if (stderr && stderr.trim()) throw new Error(stderr.trim());
  return stdout.trim();
}
async function runElevatedPowerShell(script) {
  return new Promise((resolve, reject) => {
    const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"')}"`;
    sudo.exec(command, { name: "Astra Desktop" }, (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr && stderr.trim()) return reject(new Error(stderr.trim()));
      resolve((stdout ?? "").trim());
    });
  });
}
async function runShell(command) {
  const { stdout, stderr } = await execAsync(command, { windowsHide: true, maxBuffer: 1024 * 1024 * 8 });
  if (stderr && stderr.trim()) throw new Error(stderr.trim());
  return stdout.trim();
}
async function isRunningAsAdmin() {
  try {
    const result = await runPowerShell(
      "[bool](([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))"
    );
    return result.toLowerCase().includes("true");
  } catch {
    return false;
  }
}
async function getActivePowerSchemeGuid() {
  try {
    const output = await runShell("powercfg /getactivescheme");
    const match = output.match(/[A-F0-9-]{36}/i);
    return match?.[0] ?? null;
  } catch {
    return null;
  }
}
function getSnapshotFilePath() {
  return path.join(electron.app.getPath("userData"), "last-snapshot.json");
}
async function getSystemOverview() {
  const isAdmin = await isRunningAsAdmin();
  const build = await runPowerShell("(Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion').DisplayVersion").catch(() => "Unknown");
  const freeDiskOutput = await runPowerShell("(Get-PSDrive -Name C).Free / 1GB | ForEach-Object { [math]::Round($_, 1) }").catch(() => "0");
  return {
    osName: `${os.type()} ${os.release()}`,
    osBuild: String(build),
    cpu: os.cpus()[0]?.model ?? "Unknown CPU",
    totalMemoryGb: Number((os.totalmem() / 1024 / 1024 / 1024).toFixed(1)),
    freeDiskGb: Number(freeDiskOutput || 0),
    deviceName: os.hostname(),
    isAdmin,
    lastSnapshotAt: null
  };
}
const REGISTRY_TARGETS = [
  { path: "HKCU:\\System\\GameConfigStore", name: "GameDVR_Enabled", valueType: "REG_DWORD", existed: false, value: null },
  { path: "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\GameDVR", name: "AppCaptureEnabled", valueType: "REG_DWORD", existed: false, value: null },
  { path: "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile", name: "NetworkThrottlingIndex", valueType: "REG_DWORD", existed: false, value: null },
  { path: "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile", name: "SystemResponsiveness", valueType: "REG_DWORD", existed: false, value: null },
  { path: "HKCU:\\Control Panel\\Desktop", name: "MenuShowDelay", valueType: "REG_SZ", existed: false, value: null }
];
const SERVICE_TARGETS = ["DiagTrack", "dmwappushservice"];
async function readRegistryValue(target) {
  const script = `
    try {
      $value = (Get-ItemProperty -Path '${target.path}' -Name '${target.name}' -ErrorAction Stop).'${target.name}'
      Write-Output $value
    } catch {
      Write-Output '__ASTRA_MISSING__'
    }
  `;
  const result = await runPowerShell(script);
  if (result === "__ASTRA_MISSING__") return { ...target, existed: false, value: null };
  return { ...target, existed: true, value: target.valueType === "REG_DWORD" ? Number(result) : result };
}
async function readServiceValue(name) {
  const script = `
    try {
      $svc = Get-CimInstance Win32_Service -Filter "Name='${name}'"
      if ($null -eq $svc) { Write-Output '__ASTRA_MISSING__' } else { Write-Output "$($svc.StartMode)|$($svc.State)" }
    } catch {
      Write-Output '__ASTRA_MISSING__'
    }
  `;
  const result = await runPowerShell(script);
  if (result === "__ASTRA_MISSING__") return { name, startMode: null, status: null };
  const [startMode, status] = result.split("|");
  return { name, startMode: startMode ?? null, status: status ?? null };
}
async function createSnapshot() {
  const [registry, services, powerSchemeGuid] = await Promise.all([
    Promise.all(REGISTRY_TARGETS.map(readRegistryValue)),
    Promise.all(SERVICE_TARGETS.map(readServiceValue)),
    getActivePowerSchemeGuid()
  ]);
  const snapshot = {
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    powerSchemeGuid,
    registry,
    services
  };
  await fs.writeFile(getSnapshotFilePath(), JSON.stringify(snapshot, null, 2), "utf8");
  return snapshot;
}
async function readSnapshot() {
  try {
    const file = await fs.readFile(getSnapshotFilePath(), "utf8");
    return JSON.parse(file);
  } catch {
    return null;
  }
}
async function step(label, action) {
  try {
    const details = await action();
    return { label, success: true, details };
  } catch (error) {
    return { label, success: false, details: error instanceof Error ? error.message : "Unknown error" };
  }
}
async function ensureSnapshot() {
  const snapshot = await readSnapshot();
  if (snapshot) return snapshot;
  return createSnapshot();
}
async function createRestorePoint() {
  const entries = [
    await step("Create Windows restore point", async () => {
      await runElevatedPowerShell("Enable-ComputerRestore -Drive 'C:\\' -ErrorAction SilentlyContinue; Checkpoint-Computer -Description 'Astra Desktop Restore Point' -RestorePointType 'MODIFY_SETTINGS'");
      return "Restore point request sent to Windows.";
    })
  ];
  const success = entries.every((entry) => entry.success);
  return { action: "restore-point", success, summary: success ? "Restore point created successfully." : "Windows blocked restore point creation. Check System Protection.", entries, snapshotPath: null };
}
async function cleanupJunk() {
  await ensureSnapshot();
  const cleanupScript = `
    $paths = @($env:TEMP,"$env:LOCALAPPDATA\\Temp","$env:WINDIR\\Temp","$env:LOCALAPPDATA\\D3DSCache","$env:LOCALAPPDATA\\NVIDIA\\DXCache")
    foreach ($path in $paths) {
      if (Test-Path $path) {
        Get-ChildItem -LiteralPath $path -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
      }
    }
    Clear-RecycleBin -Force -ErrorAction SilentlyContinue
    Write-Output "Temporary files removed from common cache directories."
  `;
  const entries = [await step("Clear temp folders and caches", async () => runElevatedPowerShell(cleanupScript))];
  const success = entries.every((entry) => entry.success);
  return { action: "cleanup", success, summary: success ? "Cleanup completed." : "Cleanup finished with warnings.", entries, snapshotPath: getSnapshotFilePath() };
}
async function applyFpsProfile() {
  await ensureSnapshot();
  const entries = [
    await step("Disable Game DVR capture", async () => runElevatedPowerShell('reg add "HKCU\\System\\GameConfigStore" /v GameDVR_Enabled /t REG_DWORD /d 0 /f; reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\GameDVR" /v AppCaptureEnabled /t REG_DWORD /d 0 /f; Write-Output "Game DVR disabled."')),
    await step("Set high performance power plan", async () => {
      await runElevatedPowerShell('powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c; Write-Output "High performance power plan activated."');
      return "High performance plan applied.";
    }),
    await step("Tune multimedia scheduler", async () => runElevatedPowerShell('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v NetworkThrottlingIndex /t REG_DWORD /d 4294967295 /f; reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v SystemResponsiveness /t REG_DWORD /d 0 /f; Write-Output "System profile tuned for lower latency."'))
  ];
  const success = entries.every((entry) => entry.success);
  return { action: "fps-profile", success, summary: success ? "FPS profile applied." : "FPS profile applied with warnings.", entries, requiresRestart: true, snapshotPath: getSnapshotFilePath() };
}
async function optimizeServices() {
  await ensureSnapshot();
  const entries = [
    await step("Disable Connected User Experiences service", async () => runElevatedPowerShell("sc.exe stop DiagTrack | Out-Null; sc.exe config DiagTrack start= disabled | Out-Null; Write-Output 'DiagTrack disabled.'")),
    await step("Disable dmwappushservice", async () => runElevatedPowerShell("sc.exe stop dmwappushservice | Out-Null; sc.exe config dmwappushservice start= disabled | Out-Null; Write-Output 'dmwappushservice disabled.'"))
  ];
  const success = entries.every((entry) => entry.success);
  return { action: "services", success, summary: success ? "Service optimization applied." : "Service optimization finished with warnings.", entries, requiresRestart: true, snapshotPath: getSnapshotFilePath() };
}
async function optimizeRegistry() {
  await ensureSnapshot();
  const entries = [
    await step("Reduce menu open delay", async () => runElevatedPowerShell('reg add "HKCU\\Control Panel\\Desktop" /v MenuShowDelay /t REG_SZ /d 0 /f; Write-Output "Menu delay reduced."'))
  ];
  const success = entries.every((entry) => entry.success);
  return { action: "registry", success, summary: success ? "Registry tweaks applied." : "Registry tweaks finished with warnings.", entries, snapshotPath: getSnapshotFilePath() };
}
async function optimizeNetwork() {
  await ensureSnapshot();
  const entries = [
    await step("Flush DNS cache", async () => runShell("ipconfig /flushdns")),
    await step("Reset Winsock catalog", async () => runElevatedPowerShell('netsh winsock reset; Write-Output "Winsock reset queued."'))
  ];
  const success = entries.every((entry) => entry.success);
  return { action: "network", success, summary: success ? "Network profile refreshed." : "Network profile finished with warnings.", entries, requiresRestart: true, snapshotPath: getSnapshotFilePath() };
}
async function optimizeAll() {
  await createRestorePoint().catch(() => null);
  const groups = await Promise.all([cleanupJunk(), applyFpsProfile(), optimizeServices(), optimizeRegistry()]);
  const entries = groups.flatMap((group) => group.entries);
  const success = groups.every((group) => group.success);
  return { action: "full-optimize", success, summary: success ? "Astra optimization completed successfully." : "Astra optimization completed with some warnings.", entries, requiresRestart: true, snapshotPath: getSnapshotFilePath() };
}
async function restoreRegistry(entry) {
  const basePath = entry.path.replace("HKCU:\\", "HKCU\\").replace("HKLM:\\", "HKLM\\");
  if (!entry.existed) {
    return runElevatedPowerShell(`reg delete "${basePath}" /v ${entry.name} /f; Write-Output "Removed ${entry.name}."`);
  }
  const value = entry.valueType === "REG_DWORD" ? String(Number(entry.value ?? 0)) : String(entry.value ?? "");
  return runElevatedPowerShell(`reg add "${basePath}" /v ${entry.name} /t ${entry.valueType} /d ${value} /f; Write-Output "Restored ${entry.name}."`);
}
async function restoreService(entry) {
  if (!entry.startMode) return `Skipped ${entry.name}.`;
  const startMap = { Auto: "auto", Manual: "demand", Disabled: "disabled" };
  const start = startMap[entry.startMode] ?? "demand";
  return runElevatedPowerShell(`sc.exe config ${entry.name} start= ${start} | Out-Null; Write-Output "Restored ${entry.name}."`);
}
async function rollbackLastSnapshot() {
  const snapshot = await readSnapshot();
  if (!snapshot) {
    return {
      action: "rollback",
      success: false,
      summary: "No snapshot was found.",
      entries: [{ label: "Read snapshot", success: false, details: "Astra has no saved snapshot yet." }],
      snapshotPath: null
    };
  }
  const entries = [];
  for (const reg of snapshot.registry) entries.push(await step(`Restore ${reg.name}`, async () => restoreRegistry(reg)));
  for (const svc of snapshot.services) entries.push(await step(`Restore ${svc.name}`, async () => restoreService(svc)));
  if (snapshot.powerSchemeGuid) {
    entries.push(await step("Restore power plan", async () => {
      await runElevatedPowerShell(`powercfg /setactive ${snapshot.powerSchemeGuid}; Write-Output "Power scheme restored."`);
      return "Power scheme restored.";
    }));
  }
  const success = entries.every((entry) => entry.success);
  return { action: "rollback", success, summary: success ? "Previous Astra snapshot restored." : "Rollback completed with warnings.", entries, requiresRestart: true, snapshotPath: getSnapshotFilePath() };
}
const ACTION_MAP = {
  cleanup: cleanupJunk,
  fps: applyFpsProfile,
  services: optimizeServices,
  registry: optimizeRegistry,
  network: optimizeNetwork,
  all: optimizeAll
};
function registerIpcHandlers(_mainWindow) {
  electron.ipcMain.handle("app:get-config", async () => ({
    apiBaseUrl: process.env.API_BASE_URL ?? "https://astraboost.ru",
    lastUserEmail: appStore.get("lastUserEmail")
  }));
  electron.ipcMain.handle("app:set-token", async (_event, token, email) => {
    if (token) appStore.set("authToken", token);
    else appStore.delete("authToken");
    if (email) appStore.set("lastUserEmail", email);
    return true;
  });
  electron.ipcMain.handle("app:get-token", async () => appStore.get("authToken") ?? null);
  electron.ipcMain.handle("system:get-overview", async () => getSystemOverview());
  electron.ipcMain.handle("system:is-admin", async () => isRunningAsAdmin());
  electron.ipcMain.handle("system:create-restore-point", async () => createRestorePoint());
  electron.ipcMain.handle("system:run-action", async (_event, action) => ACTION_MAP[action]());
  electron.ipcMain.handle("system:rollback", async () => rollbackLastSnapshot());
  electron.ipcMain.handle("shell:open-external", async (_event, url) => {
    await electron.shell.openExternal(url);
    return true;
  });
}
function createWindow() {
  const window = new electron.BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1260,
    minHeight: 820,
    backgroundColor: "#02030a",
    title: "Astra Desktop",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  registerIpcHandlers();
  if (utils.is.dev && process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  return window;
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.astra.desktop");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
