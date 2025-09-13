'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Map from '../../../components/Map';
import { fetchRoute } from '../../../lib/api';

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
      <div>
        <h2 className="text-xl font-semibold">Spots</h2>
        <ol className="list-decimal pl-5 space-y-1">
          {data.spots.map((rs) => (
            <li key={rs.spot.id}>{rs.spot.name}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

