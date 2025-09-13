/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { createPrismaMock } from './utils';

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {
      return createPrismaMock();
    }
  }
}));

import { buildServer } from '../src/server';

describe('auth routes', () => {
  it('registers and logs in a user', async () => {
    const app = buildServer();

    const register = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'test@example.com', password: 'secret123' },
    });
    expect(register.statusCode).toBe(200);
    const token = register.json().token;
    expect(typeof token).toBe('string');

    const login = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'test@example.com', password: 'secret123' },
    });
    expect(login.statusCode).toBe(200);
    expect(typeof login.json().token).toBe('string');
  });

  it('rejects invalid credentials', async () => {
    const app = buildServer();

    const hash = await bcrypt.hash('secret123', 10);
    await (app as any).prisma.user.create({ data: { email: 'test@example.com', passwordHash: hash } });

    const res = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'test@example.com', password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
  });
});
