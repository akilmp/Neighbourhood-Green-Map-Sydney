import { NextResponse } from 'next/server';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Fetches a single spot from the Fastify backend.
 *
 * As with the collection route, query parameters from the incoming request are
 * forwarded so that the backend can apply any additional filtering or logic.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const apiUrl = new URL(`/spots/${params.id}`, apiBase);
  const { search } = new URL(req.url);
  apiUrl.search = search;

  const res = await fetch(apiUrl.toString());
  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
