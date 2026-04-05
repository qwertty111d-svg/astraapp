import fs from "node:fs/promises";
import { getActivePowerSchemeGuid, getSnapshotFilePath } from "./system";
import { runPowerShell } from "./powershell";
import type { OptimizationSnapshot, RegistryBackupEntry, ServiceBackupEntry } from "../types";

const REGISTRY_TARGETS: Array<RegistryBackupEntry> = [
  { path: "HKCU:\\System\\GameConfigStore", name: "GameDVR_Enabled", valueType: "REG_DWORD", existed: false, value: null },
  { path: "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\GameDVR", name: "AppCaptureEnabled", valueType: "REG_DWORD", existed: false, value: null },
  { path: "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile", name: "NetworkThrottlingIndex", valueType: "REG_DWORD", existed: false, value: null },
  { path: "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile", name: "SystemResponsiveness", valueType: "REG_DWORD", existed: false, value: null },
  { path: "HKCU:\\Control Panel\\Desktop", name: "MenuShowDelay", valueType: "REG_SZ", existed: false, value: null }
];

const SERVICE_TARGETS = ["DiagTrack", "dmwappushservice"];

/** Reads a registry value before Astra mutates it. */
async function readRegistryValue(target: RegistryBackupEntry): Promise<RegistryBackupEntry> {
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

/** Reads a service start mode and state. */
async function readServiceValue(name: string): Promise<ServiceBackupEntry> {
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

/** Creates the latest Astra snapshot JSON. */
export async function createSnapshot(): Promise<OptimizationSnapshot> {
  const [registry, services, powerSchemeGuid] = await Promise.all([
    Promise.all(REGISTRY_TARGETS.map(readRegistryValue)),
    Promise.all(SERVICE_TARGETS.map(readServiceValue)),
    getActivePowerSchemeGuid(),
  ]);

  const snapshot: OptimizationSnapshot = {
    createdAt: new Date().toISOString(),
    powerSchemeGuid,
    registry,
    services,
  };

  await fs.writeFile(getSnapshotFilePath(), JSON.stringify(snapshot, null, 2), "utf8");
  return snapshot;
}

/** Reads the previously stored Astra snapshot, if it exists. */
export async function readSnapshot(): Promise<OptimizationSnapshot | null> {
  try {
    const file = await fs.readFile(getSnapshotFilePath(), "utf8");
    return JSON.parse(file) as OptimizationSnapshot;
  } catch {
    return null;
  }
}
