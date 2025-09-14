'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ReportSpotPage() {
  const { id } = useParams();
  const router = useRouter();
  const [reason, setReason] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotId: id as string, reason }),
    });
    router.push(`/spots/${id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <textarea
        className="w-full border p-2"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for report"
      />
      <button
        type="submit"
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Submit Report
      </button>
    </form>
  );
}
