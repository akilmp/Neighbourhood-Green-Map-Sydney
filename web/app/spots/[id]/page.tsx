'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchSpot } from '../../../lib/api';

export default function SpotPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data } = useQuery({ queryKey: ['spot', id], queryFn: () => fetchSpot(id), enabled: !!id });
  if (!data) return <div className="p-4">Loading...</div>;
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">{data.name}</h1>
      <p>{data.description}</p>
    </div>
  );
}
