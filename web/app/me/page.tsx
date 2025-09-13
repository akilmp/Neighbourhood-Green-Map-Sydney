'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFavourites, removeFavourite } from '../../lib/api';

export default function MePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['favourites'], queryFn: fetchFavourites });
  const removeMutation = useMutation(removeFavourite, {
    onSuccess: () => queryClient.invalidateQueries(['favourites']),
  });

  if (isLoading) return <div className="p-4">Loading...</div>;
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">My Favourite Spots</h1>
      <ul className="list-disc pl-5 space-y-1">
        {data?.map((spot) => (
          <li key={spot.id} className="flex items-center gap-2">
            <span>{spot.name}</span>
            <button
              className="text-sm text-red-600"
              onClick={() => removeMutation.mutate(spot.id)}
              disabled={removeMutation.isLoading && removeMutation.variables === spot.id}
            >
              {removeMutation.isLoading && removeMutation.variables === spot.id ? 'Removing...' : 'Remove'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
