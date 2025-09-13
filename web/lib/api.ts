import { Spot, Report, Route } from './types';


export interface SpotFilters {
  bbox?: string;
  radius?: number;
  tags?: string[];
  q?: string;
}

export async function fetchSpots(filters: SpotFilters = {}): Promise<Spot[]> {
  const params = new URLSearchParams();
  if (filters.bbox) params.set('bbox', filters.bbox);
  if (typeof filters.radius === 'number') params.set('radius', String(filters.radius));
  if (filters.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));
  if (filters.q) params.set('q', filters.q);

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

export interface RouteInput {
  name: string;
  description?: string;
  spotIds: string[];
}

export async function createRoute(data: RouteInput): Promise<Route> {
  const res = await fetch('/api/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create route');
  return res.json();
}

export async function updateRoute(id: string, data: Partial<RouteInput>): Promise<Route> {
  const res = await fetch(`/api/routes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update route');
  return res.json();
}

export async function deleteRoute(id: string): Promise<void> {
  const res = await fetch(`/api/routes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete route');

}
