import { NextResponse } from 'next/server';

const apiBase = process.env.API_URL || 'http://localhost:3001';

export async function GET() {
  const res = await fetch(`${apiBase}/me/favourites`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
