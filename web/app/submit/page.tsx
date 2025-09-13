'use client';

import { useState } from 'react';
import Button from '../../components/ui/Button';

export default function SubmitPage() {
  const [file, setFile] = useState<File | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const res = await fetch(`/api/upload-url?filename=${encodeURIComponent(file.name)}`);
    const { url } = await res.json();
    await fetch(url, { method: 'PUT', body: file });
    alert('Uploaded');
  };
  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <Button type="submit">Submit</Button>
    </form>
  );
}
