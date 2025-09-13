'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Button from '../../components/ui/Button';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn('credentials', { username, password, callbackUrl: '/' });
  };
  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-w-sm mx-auto">
      <input
        className="border p-2 w-full"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        className="border p-2 w-full"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <Button type="submit" className="w-full">Sign In</Button>
    </form>
  );
}
