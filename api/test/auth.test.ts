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

vi.mock('@fastify/redis', () => ({
  default: (_f: any, _o: any, done: any) => done(),
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

  it('sets secure cookie attributes in production', async () => {
    const oldNodeEnv = process.env.NODE_ENV;
    const oldCookieSecure = process.env.COOKIE_SECURE;
    const oldCookieDomain = process.env.COOKIE_DOMAIN;
    process.env.NODE_ENV = 'production';
    process.env.COOKIE_SECURE = 'true';
    process.env.COOKIE_DOMAIN = 'example.com';

    const app = buildServer();

    const hash = await bcrypt.hash('secret123', 10);
    await (app as any).prisma.user.create({
      data: { email: 'test@example.com', passwordHash: hash, emailVerified: true },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'test@example.com', password: 'secret123' },
    });
    expect(res.statusCode).toBe(200);
    const cookie = res.cookies.find((c: any) => c.name === 'token');
    expect(cookie).toBeTruthy();
    const c = cookie!;
    expect(c.httpOnly).toBe(true);
    expect(c.secure).toBe(true);
    expect(String(c.sameSite).toLowerCase()).toBe('strict');
    expect(c.path).toBe('/');
    expect(c.domain).toBe('example.com');

    process.env.NODE_ENV = oldNodeEnv;
    if (oldCookieSecure === undefined) delete process.env.COOKIE_SECURE;
    else process.env.COOKIE_SECURE = oldCookieSecure;
    if (oldCookieDomain === undefined) delete process.env.COOKIE_DOMAIN;
    else process.env.COOKIE_DOMAIN = oldCookieDomain;
  });
});
