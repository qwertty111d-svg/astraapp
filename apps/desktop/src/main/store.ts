import ElectronStore from "electron-store";

export interface SessionStoreSchema {
  apiBaseUrl: string;
  authToken?: string;
  lastUserEmail?: string;
}

// electron-store can be exposed either as a constructor itself or as a default export
// depending on how the main process bundle resolves ESM/CJS interop at runtime.
const StoreCtor = (ElectronStore as unknown as { default?: typeof ElectronStore }).default ?? ElectronStore;

export const appStore = new StoreCtor<SessionStoreSchema>({
  defaults: {
    apiBaseUrl: process.env.API_BASE_URL ?? "https://astraboost.ru",
  },
});
