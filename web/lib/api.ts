import { Spot, Report, Route } from './types';


export interface SpotFilters {
  bbox?: string;
  center?: string;
  radius?: number;
  tags?: string[];
  category?: string;
}

export async function fetchSpots(filters: SpotFilters = {}): Promise<Spot[]> {
  const params = new URLSearchParams();
  if (filters.bbox) params.set('bbox', filters.bbox);
  if (filters.center) params.set('center', filters.center);
  if (typeof filters.radius === 'number') params.set('radius', String(filters.radius));
  if (filters.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));
  if (filters.category) params.set('category', filters.category);

  const query = params.toString();
  const res = await fetch(`/api/spots${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch spots');
  return res.json();
}

export async function fetchSpot(id: string): Promise<Spot> {
  const res = await fetch(`/api/spots/${id}`);
  if (!res.ok) throw new Error('Failed to fetch spot');
  return res.json();
}

export async function fetchModerationQueue(): Promise<Report[]> {
  const res = await fetch('/api/moderation/queue');
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function resolveReport(id: string, action: 'approve' | 'reject'): Promise<void> {
  const res = await fetch(`/api/reports/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Failed to resolve report');

}

export async function fetchFavourites(): Promise<Spot[]> {
  const res = await fetch('/api/me/favourites');
  if (!res.ok) throw new Error('Failed to fetch favourites');
  return res.json();
}

export async function addFavourite(spotId: string): Promise<Spot> {
  const res = await fetch('/api/me/favourites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spotId }),
  });
  if (!res.ok) throw new Error('Failed to add favourite');
  return res.json();
}

export async function removeFavourite(spotId: string): Promise<void> {
  const res = await fetch(`/api/me/favourites/${spotId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove favourite');
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

export interface CreateRouteInput {
  name: string;
  description?: string;
  spotIds: string[];
}

export async function createRoute(input: CreateRouteInput): Promise<Route> {
  const res = await fetch('/api/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create route');
  return res.json();
}
