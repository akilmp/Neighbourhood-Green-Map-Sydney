'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchRoutes } from '../../lib/api';

export default function RoutesPage() {
  const { data } = useQuery({ queryKey: ['routes'], queryFn: fetchRoutes });

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Routes</h1>
        <Link href="/routes/new" className="text-green-600">
          New Route
        </Link>
      </div>
      <ul className="list-disc pl-5 space-y-1">
        {data.map((route) => (
          <li key={route.id}>
            <Link href={`/routes/${route.id}`}>{route.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

