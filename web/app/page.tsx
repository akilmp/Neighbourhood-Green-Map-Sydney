'use client';

import { useQuery } from '@tanstack/react-query';
import Map from '../components/Map';
import { fetchSpots } from '../lib/api';

export default function HomePage() {
  const { data } = useQuery({ queryKey: ['spots'], queryFn: fetchSpots });
  if (!data) return <div className="p-4">Loading...</div>;
  return <div className="h-full"> <Map spots={data} /> </div>;
}
