import type { AstraBridge } from "../../preload";

declare global {
  interface Window {
    astra: AstraBridge;
  }
}

export const astra = {
  getConfig: () => window.astra.getConfig(),
  setToken: (token: string | null, email?: string) => window.astra.setToken(token, email),
  getToken: () => window.astra.getToken(),
  getSystemOverview: () => window.astra.getSystemOverview(),
  isAdmin: () => window.astra.isAdmin(),
  createRestorePoint: () => window.astra.createRestorePoint(),
  runAction: (action: "cleanup" | "fps" | "services" | "registry" | "network" | "all") =>
    window.astra.runAction(action),
  rollback: () => window.astra.rollback(),
  openExternal: (url: string) => window.astra.openExternal(url),
};
