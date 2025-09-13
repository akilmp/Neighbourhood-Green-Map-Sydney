import { Spot } from './types';

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

export async function fetchFavourites(): Promise<Spot[]> {
  const res = await fetch('/api/me/favourites');
  if (!res.ok) throw new Error('Failed to fetch favourites');
  return res.json();
}

export async function addFavourite(id: string): Promise<void> {
  const res = await fetch(`/api/me/favourites/${id}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to add favourite');
}

export async function removeFavourite(id: string): Promise<void> {
  const res = await fetch(`/api/me/favourites/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove favourite');
}
