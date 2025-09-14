'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Map from '../components/Map';
import FilterBar, { FilterState } from '../components/FilterBar';
import { fetchSpots } from '../lib/api';

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>({
    q: '',
    category: '',
    tags: '',
    radius: 1000,
  });

  const { data } = useQuery({
    queryKey: ['spots', filters],
    queryFn: () =>
      fetchSpots({
        q: filters.q || undefined,
        radius: filters.radius,
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
        <Map spots={data} />
      </div>
    </div>
  );
}
