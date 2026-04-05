import os from "node:os";
import path from "node:path";
import { app } from "electron";
import { runPowerShell, runShell } from "./powershell";
import type { SystemOverview } from "../types";

/** Checks if current process has admin rights. */
export async function isRunningAsAdmin(): Promise<boolean> {
  try {
    const result = await runPowerShell(
      "[bool](([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))"
    );
    return result.toLowerCase().includes("true");
  } catch {
    return false;
  }
}

/** Returns active Windows power scheme GUID. */
export async function getActivePowerSchemeGuid(): Promise<string | null> {
  try {
    const output = await runShell("powercfg /getactivescheme");
    const match = output.match(/[A-F0-9-]{36}/i);
    return match?.[0] ?? null;
  } catch {
    return null;
  }
}

/** Returns Astra snapshot path inside userData. */
export function getSnapshotFilePath(): string {
  return path.join(app.getPath("userData"), "last-snapshot.json");
}

/** Builds the machine overview shown on dashboard. */
export async function getSystemOverview(): Promise<SystemOverview> {
  const isAdmin = await isRunningAsAdmin();
  const build = await runPowerShell("(Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion').DisplayVersion")
    .catch(() => "Unknown");
  const freeDiskOutput = await runPowerShell("(Get-PSDrive -Name C).Free / 1GB | ForEach-Object { [math]::Round($_, 1) }")
    .catch(() => "0");

  return {
    osName: `${os.type()} ${os.release()}`,
    osBuild: String(build),
    cpu: os.cpus()[0]?.model ?? "Unknown CPU",
    totalMemoryGb: Number((os.totalmem() / 1024 / 1024 / 1024).toFixed(1)),
    freeDiskGb: Number(freeDiskOutput || 0),
    deviceName: os.hostname(),
    isAdmin,
    lastSnapshotAt: null,
  };
}
