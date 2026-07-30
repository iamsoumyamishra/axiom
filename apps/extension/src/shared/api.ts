import { getTokens, setTokens, clearTokens, getApiUrl } from './storage';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens?.refreshToken) return null;

  const apiUrl = await getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      await clearTokens();
      return null;
    }
    const newTokens = json.data;
    await setTokens(newTokens);
    return newTokens.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { retry?: boolean } = {},
): Promise<{ data: T; response: Response }> {
  const tokens = await getTokens();
  const apiUrl = await getApiUrl();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  const body = options.body ? JSON.stringify(options.body) : undefined;

  let response = await fetch(`${apiUrl}/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
    body,
  });

  if (response.status === 401 && tokens?.refreshToken && options.retry !== false) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${apiUrl}/${path}`, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string>) },
        body,
      });
    } else {
      await clearTokens();
      throw new ApiError('SESSION_EXPIRED', 'Session expired. Please sign in again.', 401);
    }
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.error?.code ?? 'API_ERROR',
      json.error?.message ?? 'Request failed',
      response.status,
    );
  }

  return { data: json.data as T, response };
}

export async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const search = params
    ? `?${Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
        .join('&')}`
    : '';
  const { data } = await apiFetch<T>(`${path}${search}`);
  return data;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await apiFetch<T>(path, { method: 'POST', body } as RequestInit);
  return data;
}

export async function apiDelete(path: string): Promise<void> {
  await apiFetch(path, { method: 'DELETE' });
}
