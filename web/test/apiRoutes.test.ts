import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET as listSpots } from '../app/api/spots/route';
import { GET as getSpot } from '../app/api/spots/[id]/route';

const apiBase = 'http://localhost:3001';
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('spots API routes', () => {
  it('returns list of spots', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([{ id: '1' }]),
      status: 200,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await listSpots(new Request('http://example.com'));
    const data = await res.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledWith(`${apiBase}/spots`);
  });

  it('returns single spot', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ id: '1' }),
      status: 200,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await getSpot(new Request('http://example.com'), { params: { id: '1' } });
    const data = await res.json();

    expect(data.id).toBe('1');
    expect(fetchMock).toHaveBeenCalledWith(`${apiBase}/spots/1`);
  });

  it('returns 404 for missing spot', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({}),
      status: 404,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await getSpot(new Request('http://example.com'), { params: { id: '99' } });

    expect(res.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledWith(`${apiBase}/spots/99`);
  });

  it('forwards all filters to backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([]),
      status: 200,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const req = new Request(
      'http://example.com?bbox=1,2,3,4&radius=5&tags=a,b&category=c&q=search&center=6,7'
    );
    await listSpots(req);

    const expected = new URLSearchParams({
      bbox: '1,2,3,4',
      radius: '5',
      tags: 'a,b',
      category: 'c',
      q: 'search',
      center: '6,7',
    }).toString();
    expect(fetchMock).toHaveBeenCalledWith(`${apiBase}/spots?${expected}`);
  });
});
