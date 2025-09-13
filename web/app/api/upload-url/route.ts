import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename') ?? 'file';
  return NextResponse.json({ url: `https://example.com/upload/${filename}` });
}
