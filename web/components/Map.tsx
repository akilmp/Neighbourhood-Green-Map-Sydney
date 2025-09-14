'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
  onLocation?: (coords: { lat: number; lng: number }) => void;
}

function LocateControl({
  onLocate,
}: {
  onLocate?: (coords: { lat: number; lng: number }) => void;
}) {
  const map = useMap();

  React.useEffect(() => {
    const control = new L.Control({ position: 'topleft' });
    control.onAdd = () => {
      const button = L.DomUtil.create('button', 'leaflet-bar');
      button.type = 'button';
      button.title = 'Use my location';
      button.innerHTML = '📍';
      L.DomEvent.on(button, 'click', () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude]);
            onLocate?.({ lat: latitude, lng: longitude });
          });
        }
      });
      return button;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map, onLocate]);

  return null;
}

export default function Map({ spots, onMarkerClick, onLocation }: MapProps) {
  return (
    <MapContainer
      center={[-33.865143, 151.2099] as LatLngExpression}
      zoom={12}
      className="h-full"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocateControl onLocate={onLocation} />
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={(cluster: any) => {
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

