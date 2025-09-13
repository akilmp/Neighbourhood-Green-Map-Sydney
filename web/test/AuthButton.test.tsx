import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, type Mock, describe, it, expect } from 'vitest';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { useSession } from 'next-auth/react';
import AuthButton from '../components/AuthButton';

describe('AuthButton', () => {
  const mockedUseSession = useSession as unknown as Mock;

  it('shows sign in when logged out', () => {
    mockedUseSession.mockReturnValue({ data: null });
    render(<AuthButton />);
    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('shows sign out when logged in', () => {
    mockedUseSession.mockReturnValue({ data: { user: { email: 'test@example.com' } } });
    render(<AuthButton />);
    expect(screen.getByText('Sign out')).toBeTruthy();
  });
});
