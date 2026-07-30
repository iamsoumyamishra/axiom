import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('axiom_token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 },
    );
  }

  const response = await fetch(`${API_BASE}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true, data: data.data });
}
