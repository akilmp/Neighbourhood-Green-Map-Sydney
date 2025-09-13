import { NextResponse } from 'next/server';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const res = await fetch(`${apiBase}/me/favourites/${params.id}`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const res = await fetch(`${apiBase}/me/favourites/${params.id}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
