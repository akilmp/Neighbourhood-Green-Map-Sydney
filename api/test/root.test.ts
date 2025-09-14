import { describe, it, expect, vi } from 'vitest';
import { buildServer } from '../src/server';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {},
  PutObjectCommand: class {},
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue(''),
}));

describe('root route', () => {
  it('returns hello', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ hello: 'world' });
  });
});
