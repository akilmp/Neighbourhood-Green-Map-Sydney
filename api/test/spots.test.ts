/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPrismaMock } from './utils';

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {
      return createPrismaMock();
    }
  }
}));

import { buildServer } from '../src/server';

describe('spots CRUD', () => {
  let app: ReturnType<typeof buildServer>;
  let token: string;

  beforeEach(async () => {
    app = buildServer();
    const register = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'test@example.com', password: 'secret123' },
    });
    token = register.json().token;
  });

  it('creates, retrieves, updates and deletes a spot', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/spots',
      payload: { name: 'My Spot', lat: 1, lng: 2, category: 'park' },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(createRes.statusCode).toBe(200);
    const id = createRes.json().id;

    const getRes = await app.inject({
      method: 'GET',
      url: `/spots/${id}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().name).toBe('My Spot');

    const listRes = await app.inject({
      method: 'GET',
      url: '/spots',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json().length).toBe(1);

    const updateRes = await app.inject({
      method: 'PUT',
      url: `/spots/${id}`,
      payload: { name: 'Updated Spot' },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().name).toBe('Updated Spot');

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/spots/${id}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteRes.statusCode).toBe(200);

    const afterList = await app.inject({
      method: 'GET',
      url: '/spots',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(afterList.json().length).toBe(0);
  });
});
