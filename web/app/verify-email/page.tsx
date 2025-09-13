'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(() => {
        setStatus('Email verified');
        router.push('/login');
      })
      .catch(() => setStatus('Verification failed'));
  }, [token, router]);

  return <p className="p-4 text-center">{status}</p>;
}
