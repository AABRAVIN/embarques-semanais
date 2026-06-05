export const APP_VERSION = "1.0.1";
const LS_KEY = "app_version_seen";

export function getLastSeenVersion(): string | null {
  return localStorage.getItem(LS_KEY);
}

export function markVersionSeen(): void {
  localStorage.setItem(LS_KEY, APP_VERSION);
}

export function isNewVersion(): boolean {
  return getLastSeenVersion() !== APP_VERSION;
}
