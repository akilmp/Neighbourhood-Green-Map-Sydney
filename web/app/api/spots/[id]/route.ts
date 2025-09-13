import { NextResponse } from 'next/server';

const spots = [
  { id: '1', name: 'Central Park', lat: -33.8688, lng: 151.2093, description: 'A nice park' },
  { id: '2', name: 'Hyde Park', lat: -33.869, lng: 151.211, description: 'Another park' },
];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const spot = spots.find((s) => s.id === params.id);
  if (!spot) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(spot);
}
