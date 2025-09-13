import { NextResponse } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename') ?? 'file';
  const type = searchParams.get('type') ?? '';
  const size = Number(searchParams.get('size') ?? 0);

  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  if (size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${apiBase}/uploads/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType: type, size }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to get upload URL' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
