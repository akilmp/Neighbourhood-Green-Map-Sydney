'use client';

import { useState } from 'react';
import Button from '../../components/ui/Button';

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSent(true);
  };

  if (sent) {
    return <p className="p-4 text-center">Check your email for a reset link.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-sm mx-auto">
      <input
        className="border p-2 w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <Button type="submit" className="w-full">Send Reset Link</Button>
    </form>
  );
}
