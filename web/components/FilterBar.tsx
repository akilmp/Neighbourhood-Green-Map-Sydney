'use client';

import React from 'react';

export interface FilterState {
  category: string;
  tags: string;
  radius: number;
}

export default function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  const handleChange = (key: keyof FilterState, value: string | number) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex gap-2 p-2 bg-white shadow z-[1000]">
      <select
        className="border p-1"
        value={filters.category}
        onChange={(e) => handleChange('category', e.target.value)}
      >
        <option value="">All Categories</option>
        <option value="park">Park</option>
        <option value="garden">Garden</option>
        <option value="walk">Walk</option>
        <option value="lookout">Lookout</option>
        <option value="playground">Playground</option>
        <option value="beach">Beach</option>
        <option value="other">Other</option>
      </select>
      <input
        type="text"
        className="border p-1"
        placeholder="Tags (comma separated)"
        value={filters.tags}
        onChange={(e) => handleChange('tags', e.target.value)}
      />
      <input
        type="number"
        className="border p-1 w-24"
        placeholder="Radius (m)"
        value={filters.radius}
        onChange={(e) => handleChange('radius', Number(e.target.value))}
      />
    </div>
  );
}

