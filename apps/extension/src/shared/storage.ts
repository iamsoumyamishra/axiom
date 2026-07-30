import type { AuthTokens } from './types';

const KEYS = {
  ACCESS_TOKEN: 'axiom_access_token',
  REFRESH_TOKEN: 'axiom_refresh_token',
  API_URL: 'axiom_api_url',
} as const;

export async function getTokens(): Promise<AuthTokens | null> {
  const result = await chrome.storage.local.get([KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN]);
  if (!result[KEYS.ACCESS_TOKEN]) return null;
  return {
    accessToken: result[KEYS.ACCESS_TOKEN] as string,
    refreshToken: result[KEYS.REFRESH_TOKEN] as string,
  };
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  await chrome.storage.local.set({
    [KEYS.ACCESS_TOKEN]: tokens.accessToken,
    [KEYS.REFRESH_TOKEN]: tokens.refreshToken,
  });
}

export async function clearTokens(): Promise<void> {
  await chrome.storage.local.remove([KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN]);
}

export async function getApiUrl(): Promise<string> {
  const result = await chrome.storage.local.get(KEYS.API_URL);
  return (result[KEYS.API_URL] as string) ?? 'http://localhost:4000/api/v1';
}

export async function setApiUrl(url: string): Promise<void> {
  await chrome.storage.local.set({ [KEYS.API_URL]: url });
}
