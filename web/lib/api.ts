import { Spot, Route } from './types';

export async function fetchSpots(): Promise<Spot[]> {
  const res = await fetch('/api/spots');
  if (!res.ok) throw new Error('Failed to fetch spots');
  return res.json();
}

export async function fetchSpot(id: string): Promise<Spot> {
  const res = await fetch(`/api/spots/${id}`);
  if (!res.ok) throw new Error('Failed to fetch spot');
  return res.json();
}

export async function fetchRoutes(): Promise<Route[]> {
  const res = await fetch('/api/routes');
  if (!res.ok) throw new Error('Failed to fetch routes');
  return res.json();
}

export async function fetchRoute(id: string): Promise<Route> {
  const res = await fetch(`/api/routes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch route');
  return res.json();
}
