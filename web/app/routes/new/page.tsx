'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Map from '../../../components/Map';
import Button from '../../../components/ui/Button';
import { fetchSpots, createRoute } from '../../../lib/api';
import { Spot } from '../../../lib/types';

export default function NewRoutePage() {
  const [selected, setSelected] = useState<Spot[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: spots } = useQuery({ queryKey: ['spots'], queryFn: () => fetchSpots() });

  const mutation = useMutation(createRoute, {
    onSuccess: (route) => {
      queryClient.invalidateQueries(['routes']);
      queryClient.setQueryData(['route', route.id], route);
      router.push(`/routes/${route.id}`);
    },
  });

  const handleMarkerClick = (spot: Spot) => {
    if (selected.some((s) => s.id === spot.id)) return;
    setSelected((prev) => [...prev, spot]);
  };

  const removeSpot = (id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;
    mutation.mutate({ name, description, spotIds: selected.map((s) => s.id) });
  };

  if (!spots) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">New Route</h1>
      <div className="h-64">
        <Map spots={spots} onMarkerClick={handleMarkerClick} />
      </div>
      {selected.length > 0 && (
        <ol className="list-decimal pl-5 space-y-1">
          {selected.map((spot) => (
            <li key={spot.id} className="flex justify-between items-center">
              <span>{spot.name}</span>
              <button
                className="text-sm text-red-600"
                onClick={() => removeSpot(spot.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="border p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Route name"
          required
        />
        <textarea
          className="border p-2 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <Button type="submit" disabled={mutation.isLoading || selected.length === 0}>
          {mutation.isLoading ? 'Saving...' : 'Save Route'}
        </Button>
      </form>
    </div>
  );
}

