import { NextResponse } from 'next/server';

/**
 * Proxies requests for spots to the Fastify backend.
 *
 * The API base URL is read from NEXT_PUBLIC_API_URL so the same code can run
 * both locally and in production. Any query parameters included in the incoming
 * request (e.g. `radius`, `bbox`) are forwarded to the backend so it can handle
 * geospatial filtering.
 */
export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_API_URL is not configured' },
      { status: 500 },
    );
  }

  // Construct the backend URL and propagate any query parameters from the
  // incoming request.
  const apiUrl = new URL('/spots', baseUrl);
  const { search } = new URL(req.url);
  apiUrl.search = search;

  const res = await fetch(apiUrl.toString());
  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
