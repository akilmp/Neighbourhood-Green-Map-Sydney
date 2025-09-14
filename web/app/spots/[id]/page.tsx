'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchSpot } from '../../../lib/api';

const facilityIcons: Record<string, string> = {
  toilets: '🚽',
  water: '🚰',
  bbq: '🍖',
  picnic: '🧺',
  playground: '🛝',
};

export default function SpotPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data } = useQuery({ queryKey: ['spot', id], queryFn: () => fetchSpot(id), enabled: !!id });
  if (!data) return <div className="p-4">Loading...</div>;
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{data.name}</h1>
      <p>{data.description}</p>
      {data.photos && data.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {data.photos.map((photo, i) => (
            <img
              key={photo.id}
              src={photo.url}
              alt={`${data.name} photo ${i + 1}`}
              className="w-full h-40 object-cover rounded"
            />
          ))}
        </div>
      )}
      {data.facilities && (
        <div className="flex gap-2">
          {Object.entries(data.facilities).map(([key, value]) =>
            value ? (
              <span key={key} title={key} className="text-xl">
                {facilityIcons[key] ?? '✅'}
              </span>
            ) : null
          )}
        </div>
      )}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag) => (
            <span key={tag.id} className="bg-gray-200 px-2 py-1 rounded text-sm">
              {tag.name}
            </span>
          ))}
        </div>
      )}
      <div className="font-semibold">Score: {data.voteScore ?? 0}</div>
      <Link
        href={`/spots/${id}/report`}
        className="inline-block bg-red-500 text-white px-4 py-2 rounded"
      >
        Report
      </Link>
    </div>
  );
}
