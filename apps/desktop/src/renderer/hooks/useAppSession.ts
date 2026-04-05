import { useEffect, useMemo, useState } from "react";
import { astra } from "../lib/electron";
import { fetchSession, registerDevice } from "../lib/api";
import type { ClientUser, LicenseInfo } from "../types";

interface SessionState {
  loading: boolean;
  user: ClientUser | null;
  license: LicenseInfo | null;
  refresh: () => Promise<void>;
}

export function useAppSession(): SessionState {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);

  const refresh = async () => {
    const token = await astra.getToken();
    if (!token) {
      setUser(null);
      setLicense(null);
      setLoading(false);
      return;
    }

    try {
      const [session, overview] = await Promise.all([fetchSession(), astra.getSystemOverview()]);

      setUser(session.user);
      setLicense(session.license);

      await registerDevice({
        deviceFingerprint: `${overview.deviceName}-${overview.osBuild}`,
        deviceName: overview.deviceName,
        osVersion: `${overview.osName} (${overview.osBuild})`,
      });
    } catch {
      setUser(null);
      setLicense(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return useMemo(() => ({ loading, user, license, refresh }), [loading, user, license]);
}
