import { Spot, Report } from './types';

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
