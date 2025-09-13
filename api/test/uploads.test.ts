/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildServer } from '../src/server';
import { createPrismaMock } from './utils';

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {
      return createPrismaMock();
    }
  },
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://example.com/presigned'),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {},
  PutObjectCommand: class {
    input: any;
    constructor(input: any) {
      this.input = input;
    }
  },
}));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

describe('uploads presign route', () => {
  beforeEach(() => {
    (getSignedUrl as any).mockClear();
    process.env.S3_BUCKET = 'test-bucket';
    process.env.S3_ENDPOINT = 'http://localhost:9000';
    process.env.S3_ACCESS_KEY = 'key';
    process.env.S3_SECRET_KEY = 'secret';
  });

  it('returns presigned url and key', async () => {
    const app = buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/uploads/presign',
      payload: { filename: 'test.jpg', contentType: 'image/jpeg', size: 123 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      url: 'https://example.com/presigned',
      key: expect.stringMatching(/test.jpg$/),
    });
    expect(getSignedUrl).toHaveBeenCalledOnce();
    const [, command] = (getSignedUrl as any).mock.calls[0];
    expect(command.input.Bucket).toBe('test-bucket');
    expect(command.input.Key).toMatch(/test.jpg$/);
    expect(command.input.ContentType).toBe('image/jpeg');
    expect(command.input.ContentLength).toBe(123);
  });

  it('validates request body', async () => {
    const app = buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/uploads/presign',
      payload: { filename: 'onlyname' },
    });
    expect(res.statusCode).toBe(400);
  });
});
