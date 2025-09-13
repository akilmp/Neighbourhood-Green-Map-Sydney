import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Map from '../components/Map';
import { Spot } from '../lib/types';

vi.mock('react-leaflet-cluster', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <div className="marker-cluster">{React.Children.count(children)}</div>
    ),
  };
});

describe('Map clustering', () => {
  it('clusters nearby spots', () => {
    const spots: Spot[] = [
      { id: '1', name: 'One', lat: -33.865, lng: 151.209, description: '' },
      { id: '2', name: 'Two', lat: -33.8651, lng: 151.2091, description: '' },
    ];
    const { container } = render(<Map spots={spots} />);
    const cluster = container.querySelector('.marker-cluster');
    expect(cluster?.textContent).toBe('2');
  });
});
