import { Spot } from './types';

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
