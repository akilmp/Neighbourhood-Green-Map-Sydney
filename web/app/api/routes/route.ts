import { NextResponse } from 'next/server';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET() {
  const res = await fetch(`${apiBase}/routes`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${apiBase}/routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

