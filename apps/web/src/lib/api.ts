export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const hasBody = options?.body !== undefined;
  const res = await fetch(`/api/proxy/${path}`, {
    ...options,
    headers: { ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...options?.headers },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  return res.json();
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | undefined>,
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const search = params
    ? `?${Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
        .join('&')}`
    : '';
  return apiFetch<T>(`${path}${search}`);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  return apiFetch<T>(path, { method: 'POST', body } as RequestInit);
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  return apiFetch<T>(path, { method: 'PATCH', body } as RequestInit);
}

export async function apiDelete<T>(
  path: string,
): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  return apiFetch<T>(path, { method: 'DELETE' });
}
