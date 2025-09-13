import { NextResponse } from 'next/server';

/**
 * Fetches a single spot from the Fastify backend.
 *
 * As with the collection route, query parameters from the incoming request are
 * forwarded so that the backend can apply any additional filtering or logic.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_API_URL is not configured' },
      { status: 500 },
    );
  }

  const apiUrl = new URL(`/spots/${params.id}`, baseUrl);
  const { search } = new URL(req.url);
  apiUrl.search = search;

  const res = await fetch(apiUrl.toString());
  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
