import { describe, it, expect } from 'vitest';
import { GET as listSpots } from '../app/api/spots/route';
import { GET as getSpot } from '../app/api/spots/[id]/route';

describe('spots API routes', () => {
  it('returns list of spots', async () => {
    const res = await listSpots();
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('returns single spot', async () => {
    const res = await getSpot(new Request('http://example.com'), { params: { id: '1' } });
    const data = await res.json();
    expect(data.id).toBe('1');
  });

  it('returns 404 for missing spot', async () => {
    const res = await getSpot(new Request('http://example.com'), { params: { id: '99' } });
    expect(res.status).toBe(404);
  });
});
