import { NextResponse } from 'next/server';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = new URLSearchParams();
  for (const key of ['bbox', 'radius', 'tags', 'category', 'q', 'center']) {
    const value = url.searchParams.get(key);
    if (value) params.set(key, value);
  }
  const query = params.toString();
  const res = await fetch(`${apiBase}/spots${query ? `?${query}` : ''}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${apiBase}/spots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
