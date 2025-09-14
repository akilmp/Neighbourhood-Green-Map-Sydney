import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, type Mock } from 'vitest';
import SpotPage from '../app/spots/[id]/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchSpot } from '../lib/api';
import type { Spot } from '../lib/types';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: '1' }) }));
vi.mock('../lib/api', () => ({ fetchSpot: vi.fn() }));

describe('SpotPage', () => {
  it('renders facilities and photos when present', async () => {
    const mockSpot: Spot = {
      id: '1',
      name: 'Test Spot',
      lat: 0,
      lng: 0,
      description: 'desc',
      facilities: { toilets: true },
      photos: [{ id: 'p1', url: 'http://example.com/p1.jpg' }],
      tags: [],
      voteScore: 3,
    };
    (fetchSpot as unknown as Mock).mockResolvedValue(mockSpot);
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <SpotPage />
      </QueryClientProvider>
    );
    await screen.findByText('Test Spot');
    expect(screen.getByTitle('toilets')).toBeTruthy();
    expect(screen.getByAltText('Test Spot photo 1')).toBeTruthy();
  });
});

