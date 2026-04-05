export interface SystemOverview {
  osName: string;
  osBuild: string;
  cpu: string;
  totalMemoryGb: number;
  freeDiskGb: number;
  deviceName: string;
  isAdmin: boolean;
  lastSnapshotAt: string | null;
}

export interface OptimizationLogEntry {
  label: string;
  success: boolean;
  details: string;
}

export interface OptimizationResult {
  action: string;
  success: boolean;
  requiresRestart?: boolean;
  summary: string;
  entries: OptimizationLogEntry[];
  snapshotPath?: string | null;
}

export interface RegistryBackupEntry {
  path: string;
  name: string;
  valueType: "REG_DWORD" | "REG_SZ";
  existed: boolean;
  value: string | number | null;
}

export interface ServiceBackupEntry {
  name: string;
  startMode: string | null;
  status: string | null;
}

export interface OptimizationSnapshot {
  createdAt: string;
  powerSchemeGuid: string | null;
  registry: RegistryBackupEntry[];
  services: ServiceBackupEntry[];
}
