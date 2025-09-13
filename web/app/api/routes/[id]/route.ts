import { NextResponse } from 'next/server';

const apiBase = process.env.API_URL || 'http://localhost:3001';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const res = await fetch(`${apiBase}/routes/${params.id}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const res = await fetch(`${apiBase}/routes/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const res = await fetch(`${apiBase}/routes/${params.id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

