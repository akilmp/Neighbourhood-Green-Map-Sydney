'use client';

import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const CATEGORIES = ['park', 'garden', 'playground'];
const FACILITY_OPTIONS = ['toilets', 'playground', 'bbq'];

function LocationMarker({
  onChange,
  position,
}: {
  onChange: (pos: { lat: number; lng: number }) => void;
  position: { lat: number; lng: number } | null;
}) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

export default function SubmitPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [facilities, setFacilities] = useState<Record<string, boolean>>({});
  const [tags, setTags] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleFacility = (key: string) => {
    setFacilities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name) {
      setError('Name is required');
      return;
    }
    if (!category) {
      setError('Category is required');
      return;
    }
    if (!coords) {
      setError('Location is required');
      return;
    }

    const files = photos ? Array.from(photos) : [];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Unsupported file type');
        return;
      }
      if (file.size > MAX_SIZE) {
        setError('File is too large');
        return;
      }
    }

    const photoKeys: string[] = [];
    for (const file of files) {
      const params = new URLSearchParams({
        filename: file.name,
        type: file.type,
        size: file.size.toString(),
      });
      const res = await fetch(`/api/upload-url?${params.toString()}`);
      if (!res.ok) {
        setError('Failed to get upload URL');
        return;
      }
      const { url, key } = await res.json();
      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) {
        setError('Upload failed');
        return;
      }
      photoKeys.push(key);
    }

    const payload = {
      name,
      description,
      category,
      facilities,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      lat: coords.lat,
      lng: coords.lng,
      photos: photoKeys,
    };

    const res = await fetch('/api/spots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setError('Failed to submit');
      return;
    }
    setSuccess('Spot submitted');
    setName('');
    setDescription('');
    setCategory('');
    setFacilities({});
    setTags('');
    setCoords(null);
    setPhotos(null);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {error && (
        <div role="alert" className="text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="text-green-600">
          {success}
        </div>
      )}
      <div>
        <label className="block" htmlFor="name">Name</label>
        <input
          id="name"
          className="border p-1 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block" htmlFor="description">Description</label>
        <textarea
          id="description"
          className="border p-1 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="block" htmlFor="category">Category</label>
        <select
          id="category"
          className="border p-1 w-full"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block">Facilities</label>
        {FACILITY_OPTIONS.map((f) => (
          <label key={f} className="mr-2">
            <input
              type="checkbox"
              checked={!!facilities[f]}
              onChange={() => toggleFacility(f)}
              aria-label={f}
            />
            {f}
          </label>
        ))}
      </div>
      <div>
        <label className="block" htmlFor="tags">Tags (comma separated)</label>
        <input
          id="tags"
          className="border p-1 w-full"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-2">Location</label>
        <MapContainer
          center={[-33.865143, 151.2099]}
          zoom={12}
          className="h-64"
          data-testid="map"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker onChange={setCoords} position={coords} />
        </MapContainer>
        <div className="flex space-x-2 mt-2">
          <div className="flex-1">
            <label htmlFor="lat" className="block">
              Latitude
            </label>
            <input
              id="lat"
              className="border p-1 w-full"
              value={coords?.lat ?? ''}
              onChange={(e) =>
                setCoords({ lat: Number(e.target.value), lng: coords?.lng ?? 0 })
              }
            />
          </div>
          <div className="flex-1">
            <label htmlFor="lng" className="block">
              Longitude
            </label>
            <input
              id="lng"
              className="border p-1 w-full"
              value={coords?.lng ?? ''}
              onChange={(e) =>
                setCoords({ lat: coords?.lat ?? 0, lng: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block" htmlFor="photos">Photos</label>
        <input
          id="photos"
          type="file"
          multiple
          onChange={(e) => setPhotos(e.target.files)}
        />
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
}
