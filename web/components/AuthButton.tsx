'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Button from './ui/Button';

export default function AuthButton() {
  const { data: session } = useSession();
  if (session) {
    return <Button onClick={() => signOut()}>Sign out</Button>;
  }
  return <Button onClick={() => signIn()}>Sign in</Button>;
}
