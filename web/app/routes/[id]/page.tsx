'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchRoute } from '../../../lib/api';
import Map from '../../../components/Map';

export default function RoutePage() {
  const params = useParams();
  const id = params?.id as string;
  const { data } = useQuery({
    queryKey: ['route', id],
    queryFn: () => fetchRoute(id),
    enabled: !!id,
  });

  if (!data) return <div className="p-4">Loading...</div>;

  const spots = data.spots.map((rs) => rs.spot);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{data.name}</h1>
        {data.description && <p>{data.description}</p>}
      </div>
      <div className="h-64">
        <Map spots={spots} />
      </div>
    </div>
  );
}

