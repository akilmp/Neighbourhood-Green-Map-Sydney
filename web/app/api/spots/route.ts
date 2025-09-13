import { NextResponse } from 'next/server';

const spots = [
  { id: '1', name: 'Central Park', lat: -33.8688, lng: 151.2093, description: 'A nice park' },
  { id: '2', name: 'Hyde Park', lat: -33.869, lng: 151.211, description: 'Another park' },
];

export async function GET() {
  return NextResponse.json(spots);
}
