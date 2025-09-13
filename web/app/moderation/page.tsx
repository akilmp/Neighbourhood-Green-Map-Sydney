'use client';

import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import { fetchModerationQueue, resolveReport } from '../../lib/api';
import type { Report } from '../../lib/types';

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModerationQueue()
      .then(setReports)
      .catch(() => setError('Unauthorized'));
  }, []);

  const handle = async (id: string, action: 'approve' | 'reject') => {
    try {
      await resolveReport(id, action);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert('Action failed');
    }
  };

  if (error) return <p>{error}</p>;

  return (
    <div className="p-4 space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="border p-2 flex justify-between items-center">
          <div>
            <p className="font-bold">{report.spot.name}</p>
            <p className="text-sm text-gray-600">{report.reason}</p>
          </div>
          <div className="space-x-2">
            <Button onClick={() => handle(report.id, 'approve')}>Approve</Button>
            <Button onClick={() => handle(report.id, 'reject')} className="bg-red-600">Reject</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
