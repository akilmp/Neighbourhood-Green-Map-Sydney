/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPrismaMock } from './utils';

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    constructor() {
      return createPrismaMock();
    }
  },
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {},
  PutObjectCommand: class {},
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue(''),
}));

import { buildServer } from '../src/server';

describe('routes CRUD', () => {
  let app: ReturnType<typeof buildServer>;
  let token: string;
  let spot1: string;
  let spot2: string;

  beforeEach(async () => {
    app = buildServer();
    const register = await app.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'test@example.com', password: 'secret123' },
    });
    token = register.json().token;
    const s1 = await app.inject({
      method: 'POST',
      url: '/spots',
      payload: { name: 'S1', lat: 0, lng: 0, category: 'park' },
      headers: { Authorization: `Bearer ${token}` },
    });
    spot1 = s1.json().id;
    const s2 = await app.inject({
      method: 'POST',
      url: '/spots',
      payload: { name: 'S2', lat: 1, lng: 1, category: 'park' },
      headers: { Authorization: `Bearer ${token}` },
    });
    spot2 = s2.json().id;
  });

  it('creates, retrieves, updates and deletes a route', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/routes',
      payload: {
        name: 'My Route',
        description: 'Desc',
        distanceKm: 1.2,
        path: [
          [0, 0],
          [1, 1],
        ],
        spotIds: [spot1, spot2],
        isPublished: true,
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(createRes.statusCode).toBe(200);
    const route = createRes.json();
    expect(route.spots.length).toBe(2);
    expect(route.path.coordinates.length).toBe(2);
    const id = route.id;

    const getRes = await app.inject({
      method: 'GET',
      url: `/routes/${id}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().name).toBe('My Route');

    const listRes = await app.inject({
      method: 'GET',
      url: '/routes',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.json().length).toBe(1);

    const updateRes = await app.inject({
      method: 'PUT',
      url: `/routes/${id}`,
      payload: { name: 'Updated Route', spotIds: [spot2, spot1] },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().name).toBe('Updated Route');
    expect(updateRes.json().spots[0].spotId).toBe(spot2);

    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/routes/${id}`,
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteRes.statusCode).toBe(200);

    const afterList = await app.inject({
      method: 'GET',
      url: '/routes',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(afterList.json().length).toBe(0);
  });
});
