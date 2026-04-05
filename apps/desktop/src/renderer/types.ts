export interface ClientUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  plan: string | null;
  subscriptionEndsAt: string | null;
}

export interface LicenseInfo {
  plan: string | null;
  active: boolean;
  expiresAt: string | null;
  deviceLimit: number;
  features: {
    proOptimization: boolean;
    fpsBoost: boolean;
    advancedCleanup: boolean;
    registryTweaks: boolean;
    serviceTweaks: boolean;
    oneClickRollback: boolean;
  };
}

export interface AuthPayload {
  token: string;
  user: ClientUser;
  license?: LicenseInfo | null;
}

export interface SessionPayload {
  user: ClientUser;
  license: LicenseInfo | null;
}
