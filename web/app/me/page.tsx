'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchFavourites } from '../../lib/api';

export default function MePage() {
  const { data } = useQuery({ queryKey: ['favourites'], queryFn: fetchFavourites });
  if (!data) return <div className="p-4">Loading...</div>;
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">My Favourite Spots</h1>
      <ul className="list-disc pl-5">
        {data.map((spot) => (
          <li key={spot.id}>{spot.name}</li>
        ))}
      </ul>
    </div>
  );
}
