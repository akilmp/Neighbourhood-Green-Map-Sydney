'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Spot } from '../lib/types';

interface MapProps {
  spots: Spot[];
  onMarkerClick?: (spot: Spot) => void;
}

export default function Map({ spots, onMarkerClick }: MapProps) {
  return (
    <MapContainer
      center={[-33.865143, 151.2099] as LatLngExpression}
      zoom={12}
      className="h-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={(cluster) => {
          const count = cluster.getChildCount();
          const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
          return L.divIcon({
            html: `<span>${count}</span>`,
            className: `marker-cluster marker-cluster-${size}`,
          });
        }}
      >
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng] as LatLngExpression}
            eventHandlers={
              onMarkerClick
                ? {
                    click: () => onMarkerClick(spot),
                  }
                : undefined
            }
          >
            <Popup>{spot.name}</Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}

