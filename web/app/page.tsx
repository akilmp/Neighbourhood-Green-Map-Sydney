'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Map from '../components/Map';
import FilterBar, { FilterState } from '../components/FilterBar';
import { fetchSpots } from '../lib/api';

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    tags: '',
    radius: 1000,
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data } = useQuery({
    queryKey: ['spots', filters, userLocation],
    queryFn: () =>
      fetchSpots({
        radius: filters.radius,
        center: userLocation ? `${userLocation.lng},${userLocation.lat}` : undefined,
        tags: filters.tags
          ? filters.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        category: filters.category || undefined,
      }),
  });

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="h-full flex flex-col">
      <FilterBar filters={filters} onChange={setFilters} />
      <div className="flex-1">
        <Map spots={data} onLocation={setUserLocation} />
      </div>
    </div>
  );
}
