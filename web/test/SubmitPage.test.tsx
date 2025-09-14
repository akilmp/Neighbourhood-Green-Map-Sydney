import React, { type ComponentProps } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import SubmitPage from '../app/submit/page';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: ComponentProps<'div'>) => (
    <div {...props}>{children}</div>
  ),
  TileLayer: () => <div />,
  Marker: () => <div />,
  useMapEvents: () => {},
}));

describe('SubmitPage', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('validates required fields', async () => {
    render(<SubmitPage />);
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Name is required');
  });

  it('submits form successfully', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://upload', key: 'photo-key' }),
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<SubmitPage />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Spot' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Desc' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'park' } });
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '2' } });
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Photos'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await screen.findByRole('status');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const body = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(body.name).toBe('My Spot');
    expect(body.lat).toBe(1);
    expect(body.lng).toBe(2);
    expect(body.photos).toEqual(['photo-key']);
  });
});
