import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('axiom_token')?.value;

  const url = `${API_BASE}/${path.join('/')}${req.nextUrl.search}`;
  const headers: Record<string, string> = {};
  const incomingContentType = req.headers.get('content-type');
  if (incomingContentType) headers['Content-Type'] = incomingContentType;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const body = req.method !== 'GET' ? req.body : null;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
      duplex: 'half',
    } as RequestInit & { duplex: string });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'PROXY_ERROR', message: 'Failed to connect to API server' } },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
