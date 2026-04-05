import axios from "axios";
import { z } from "zod";
import type { AuthPayload, LicenseInfo, SessionPayload } from "../types";
import { astra } from "./electron";

const loginSchema = z.object({
  email: z.string().email("Некорректная почта"),
  password: z.string().min(8, "Минимум 8 символов"),
});

async function getBaseConfig() {
  const config = await astra.getConfig();
  const token = await astra.getToken();

  return axios.create({
    baseURL: config.apiBaseUrl,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

function toErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error ?? error.message;
  }
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  loginSchema.parse({ email, password });

  try {
    const api = await getBaseConfig();
    const overview = await astra.getSystemOverview();
    const response = await api.post<AuthPayload & { ok: boolean }>("/api/desktop/login", {
      email,
      password,
      deviceName: overview.deviceName,
      deviceFingerprint: `${overview.deviceName}-${overview.osBuild}`,
      appVersion: "desktop-mvp",
    });

    await astra.setToken(response.data.token, email);
    return response.data;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function fetchSession(): Promise<SessionPayload> {
  try {
    const api = await getBaseConfig();
    const response = await api.get<{ ok: boolean; user: SessionPayload["user"]; license: LicenseInfo | null }>("/api/desktop/session");
    return { user: response.data.user, license: response.data.license };
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function fetchLicense(): Promise<LicenseInfo | null> {
  try {
    const api = await getBaseConfig();
    const response = await api.get<{ ok: boolean; license: LicenseInfo | null }>("/api/desktop/license");
    return response.data.license;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function registerDevice(payload: {
  deviceFingerprint: string;
  deviceName: string;
  osVersion: string;
}): Promise<void> {
  try {
    const api = await getBaseConfig();
    await api.post("/api/desktop/device/register", {
      deviceFingerprint: payload.deviceFingerprint,
      deviceName: payload.deviceName,
      platform: "Windows",
      appVersion: payload.osVersion,
    });
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function logout(): Promise<void> {
  try {
    const api = await getBaseConfig();
    await api.post("/api/desktop/logout");
  } catch {
    // ignore server logout errors and still clear local token
  }
  await astra.setToken(null);
}
