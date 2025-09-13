'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Spot } from '../lib/types';

export default function Map({ spots }: { spots: Spot[] }) {
  return (
    <MapContainer
      // @ts-ignore center is valid for MapContainer
      center={[-33.865143, 151.2099]}
      // @ts-ignore zoom is valid for MapContainer
      zoom={12}
      className="h-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {spots.map((spot) => (
        <Marker key={spot.id} position={[spot.lat, spot.lng] as any}>
          <Popup>{spot.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
