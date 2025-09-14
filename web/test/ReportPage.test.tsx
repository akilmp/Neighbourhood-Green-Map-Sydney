import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, afterEach } from 'vitest';
import ReportSpotPage from '../app/spots/[id]/report/page';

const originalFetch = global.fetch;

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('ReportSpotPage', () => {
  it('submits report to api', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<ReportSpotPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Bad spot' } });
    fireEvent.click(screen.getByText('Submit Report'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith('/api/reports', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotId: '1', reason: 'Bad spot' }),
    }));
  });
});
