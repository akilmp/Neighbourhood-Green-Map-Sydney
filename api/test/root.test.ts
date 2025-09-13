import { describe, it, expect } from 'vitest';
import { buildServer } from '../src/server';

describe('root route', () => {
  it('returns hello', async () => {
    const app = buildServer();
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ hello: 'world' });
  });
});
