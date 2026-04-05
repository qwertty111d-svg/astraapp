import { exec } from "node:child_process";
import { promisify } from "node:util";
import sudo from "sudo-prompt";

const execAsync = promisify(exec);

/** Runs PowerShell without elevation. */
export async function runPowerShell(script: string): Promise<string> {
  const { stdout, stderr } = await execAsync(
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"')}"`,
    { windowsHide: true, maxBuffer: 1024 * 1024 * 8 }
  );

  if (stderr && stderr.trim()) throw new Error(stderr.trim());
  return stdout.trim();
}

/** Runs PowerShell with UAC elevation. */
export async function runElevatedPowerShell(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const command = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"')}"`;
    sudo.exec(command, { name: "Astra Desktop" }, (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr && stderr.trim()) return reject(new Error(stderr.trim()));
      resolve((stdout ?? "").trim());
    });
  });
}

/** Runs a shell command and returns stdout. */
export async function runShell(command: string): Promise<string> {
  const { stdout, stderr } = await execAsync(command, { windowsHide: true, maxBuffer: 1024 * 1024 * 8 });
  if (stderr && stderr.trim()) throw new Error(stderr.trim());
  return stdout.trim();
}
