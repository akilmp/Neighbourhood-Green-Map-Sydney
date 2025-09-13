'use client';

import { useState } from 'react';
import Button from '../../components/ui/Button';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function SubmitPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Unsupported file type');
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('File is too large');
      return;
    }

    const params = new URLSearchParams({
      filename: file.name,
      type: file.type,
      size: file.size.toString(),
    });
    const res = await fetch(`/api/upload-url?${params.toString()}`);
    if (!res.ok) {
      alert('Failed to get upload URL');
      return;
    }
    const { url, key } = await res.json();

    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!uploadRes.ok) {
      alert('Upload failed');
      return;
    }

    await fetch('/api/spots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Uploaded spot',
        lat: 0,
        lng: 0,
        photos: [key],
      }),
    });

    alert('Uploaded');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <Button type="submit">Submit</Button>
    </form>
  );
}
