import { readSnapshot, createSnapshot } from "./snapshot";
import { getSnapshotFilePath } from "./system";
import { runElevatedPowerShell, runShell } from "./powershell";
import type { OptimizationResult, OptimizationLogEntry, OptimizationSnapshot, RegistryBackupEntry, ServiceBackupEntry } from "../types";

/** Runs a single action step and converts failures into UI-friendly logs. */
async function step(label: string, action: () => Promise<string>): Promise<OptimizationLogEntry> {
  try {
    const details = await action();
    return { label, success: true, details };
  } catch (error) {
    return { label, success: false, details: error instanceof Error ? error.message : "Unknown error" };
  }
}

/** Guarantees that Astra has a rollback snapshot before mutation. */
async function ensureSnapshot(): Promise<OptimizationSnapshot> {
  const snapshot = await readSnapshot();
  if (snapshot) return snapshot;
  return createSnapshot();
}

/** Requests Windows restore point creation. */
export async function createRestorePoint(): Promise<OptimizationResult> {
  const entries = [
    await step("Create Windows restore point", async () => {
      await runElevatedPowerShell("Enable-ComputerRestore -Drive 'C:\\' -ErrorAction SilentlyContinue; Checkpoint-Computer -Description 'Astra Desktop Restore Point' -RestorePointType 'MODIFY_SETTINGS'");
      return "Restore point request sent to Windows.";
    }),
  ];
  const success = entries.every((entry) => entry.success);
  return { action: "restore-point", success, summary: success ? "Restore point created successfully." : "Windows blocked restore point creation. Check System Protection.", entries, snapshotPath: null };
}

/** Clears common temp folders and caches. */
export async function cleanupJunk(): Promise<OptimizationResult> {
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

/** Applies FPS-oriented capture, power, and multimedia settings. */
export async function applyFpsProfile(): Promise<OptimizationResult> {
  await ensureSnapshot();
  const entries = [
    await step("Disable Game DVR capture", async () => runElevatedPowerShell('reg add "HKCU\\System\\GameConfigStore" /v GameDVR_Enabled /t REG_DWORD /d 0 /f; reg add "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\GameDVR" /v AppCaptureEnabled /t REG_DWORD /d 0 /f; Write-Output "Game DVR disabled."')),
    await step("Set high performance power plan", async () => { await runElevatedPowerShell('powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c; Write-Output "High performance power plan activated."'); return "High performance plan applied."; }),
    await step("Tune multimedia scheduler", async () => runElevatedPowerShell('reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v NetworkThrottlingIndex /t REG_DWORD /d 4294967295 /f; reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" /v SystemResponsiveness /t REG_DWORD /d 0 /f; Write-Output "System profile tuned for lower latency."')),
  ];
  const success = entries.every((entry) => entry.success);
  return { action: "fps-profile", success, summary: success ? "FPS profile applied." : "FPS profile applied with warnings.", entries, requiresRestart: true, snapshotPath: getSnapshotFilePath() };
}

/** Disables a very small and safer group of telemetry services. */
export async function optimizeServices(): Promise<OptimizationResult> {
  await ensureSnapshot();
  const entries = [
    await step("Disable Connected User Experiences service", async () => runElevatedPowerShell("sc.exe stop DiagTrack | Out-Null; sc.exe config DiagTrack start= disabled | Out-Null; Write-Output 'DiagTrack disabled.'")),
    await step("Disable dmwappushservice", async () => runElevatedPowerShell("sc.exe stop dmwappushservice | Out-Null; sc.exe config dmwappushservice start= disabled | Out-Null; Write-Output 'dmwappushservice disabled.'")),
  ];
  const success = entries.every((entry) => entry.success);
  return { action: "services", success, summary: success ? "Service optimization applied." : "Service optimization finished with warnings.", entries, requiresRestart: true, snapshotPath: getSnapshotFilePath() };
}

/** Applies small registry responsiveness tweaks. */
export async function optimizeRegistry(): Promise<OptimizationResult> {
  await ensureSnapshot();
  const entries = [
    await step("Reduce menu open delay", async () => runElevatedPowerShell('reg add "HKCU\\Control Panel\\Desktop" /v MenuShowDelay /t REG_SZ /d 0 /f; Write-Output "Menu delay reduced."')),
  ];
  const success = entries.every((entry) => entry.success);
  return { action: "registry", success, summary: success ? "Registry tweaks applied." : "Registry tweaks finished with warnings.", entries, snapshotPath: getSnapshotFilePath() };
}

/** Refreshes gaming-related network state. */
export async function optimizeNetwork(): Promise<OptimizationResult> {
  await ensureSnapshot();
  const entries = [
    await step("Flush DNS cache", async () => runShell("ipconfig /flushdns")),
    await step("Reset Winsock catalog", async () => runElevatedPowerShell('netsh winsock reset; Write-Output "Winsock reset queued."')),
  ];
  const success = entries.every((entry) => entry.success);
  return { action: "network", success, summary: success ? "Network profile refreshed." : "Network profile finished with warnings.", entries, requiresRestart: true, snapshotPath: getSnapshotFilePath() };
}

/** Runs the compact Astra default profile. */
export async function optimizeAll(): Promise<OptimizationResult> {
  await createRestorePoint().catch(() => null);
  const groups = await Promise.all([cleanupJunk(), applyFpsProfile(), optimizeServices(), optimizeRegistry()]);
  const entries = groups.flatMap((group) => group.entries);
  const success = groups.every((group) => group.success);
  return { action: "full-optimize", success, summary: success ? "Astra optimization completed successfully." : "Astra optimization completed with some warnings.", entries, requiresRestart: true, snapshotPath: getSnapshotFilePath() };
}

/** Restores a registry value from the stored snapshot. */
async function restoreRegistry(entry: RegistryBackupEntry): Promise<string> {
  const basePath = entry.path.replace("HKCU:\\", "HKCU\\").replace("HKLM:\\", "HKLM\\");
  if (!entry.existed) {
    return runElevatedPowerShell(`reg delete "${basePath}" /v ${entry.name} /f; Write-Output "Removed ${entry.name}."`);
  }
  const value = entry.valueType === "REG_DWORD" ? String(Number(entry.value ?? 0)) : String(entry.value ?? "");
  return runElevatedPowerShell(`reg add "${basePath}" /v ${entry.name} /t ${entry.valueType} /d ${value} /f; Write-Output "Restored ${entry.name}."`);
}

/** Restores a service start mode from the stored snapshot. */
async function restoreService(entry: ServiceBackupEntry): Promise<string> {
  if (!entry.startMode) return `Skipped ${entry.name}.`;
  const startMap: Record<string, string> = { Auto: "auto", Manual: "demand", Disabled: "disabled" };
  const start = startMap[entry.startMode] ?? "demand";
  return runElevatedPowerShell(`sc.exe config ${entry.name} start= ${start} | Out-Null; Write-Output "Restored ${entry.name}."`);
}

/** Rolls back the last Astra snapshot. */
export async function rollbackLastSnapshot(): Promise<OptimizationResult> {
  const snapshot = await readSnapshot();
  if (!snapshot) {
    return {
      action: "rollback",
      success: false,
      summary: "No snapshot was found.",
      entries: [{ label: "Read snapshot", success: false, details: "Astra has no saved snapshot yet." }],
      snapshotPath: null,
    };
  }
  const entries: OptimizationLogEntry[] = [];
  for (const reg of snapshot.registry) entries.push(await step(`Restore ${reg.name}`, async () => restoreRegistry(reg)));
  for (const svc of snapshot.services) entries.push(await step(`Restore ${svc.name}`, async () => restoreService(svc)));
  if (snapshot.powerSchemeGuid) {
    entries.push(await step("Restore power plan", async () => { await runElevatedPowerShell(`powercfg /setactive ${snapshot.powerSchemeGuid}; Write-Output "Power scheme restored."`); return "Power scheme restored."; }));
  }
  const success = entries.every((entry) => entry.success);
  return { action: "rollback", success, summary: success ? "Previous Astra snapshot restored." : "Rollback completed with warnings.", entries, requiresRestart: true, snapshotPath: getSnapshotFilePath() };
}
