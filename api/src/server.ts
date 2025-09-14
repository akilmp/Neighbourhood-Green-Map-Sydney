import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import * as Sentry from '@sentry/node';
import fastifyJwt from '@fastify/jwt';
import fastifyRedis from '@fastify/redis';
import fastifyCookie from '@fastify/cookie';
import type { CookieSerializeOptions } from '@fastify/cookie';
import { PrismaClient } from '@prisma/client';

import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { collectDefaultMetrics, Counter, register } from 'prom-client';

type RedisClient = {
  set: (key: string, value: string, opts: { EX: number }) => Promise<unknown>;
  get: (key: string) => Promise<string | null>;
  del: (key: string) => Promise<unknown>;
};

export function buildServer() {
  const enableSentry =
    !!process.env.SENTRY_DSN && process.env.DISABLE_ANALYTICS !== 'true';
  if (enableSentry) {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
  }

  const app = Fastify().withTypeProvider<ZodTypeProvider>();

  if (process.env.ENABLE_METRICS === 'true') {
    collectDefaultMetrics();
    const httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests received',
    });

    app.addHook('onRequest', (_, __, done) => {
      httpRequestsTotal.inc();
      done();
    });

    app.get('/metrics', async (_, reply) => {
      reply.header('Content-Type', register.contentType);
      return register.metrics();
    });
  }

  app.setErrorHandler((error, request, reply) => {
    if (enableSentry) {
      Sentry.captureException(error);
    }
    reply.send(error);
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // plugins
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'supersecret',
  });
  app.register(fastifyCookie);
  if (process.env.NODE_ENV !== 'test') {
    app.register(fastifyRedis, {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      lazyConnect: true,
    });
  }

  // prisma
  const prisma = new PrismaClient();
  app.decorate('prisma', prisma);

  const cookieOptions: CookieSerializeOptions = {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    domain: process.env.COOKIE_DOMAIN,
  };

  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  app.decorate('adminOnly', async function (request: FastifyRequest, reply: FastifyReply) {
    const user = await prisma.user.findUnique({ where: { id: request.user.id } });
    if (user?.role !== 'admin') {
      reply.status(403).send({ message: 'Forbidden' });
    }
  });

  app.get('/', async () => ({ hello: 'world' }));

  // Uploads
  app.post('/uploads/presign', {
    schema: {
      body: z.object({
        filename: z.string(),
        contentType: z.string(),
        size: z.number().int().positive(),
      }),
      response: {
        200: z.object({ url: z.string().url(), key: z.string() }),
      },
    },
  }, async (req) => {
    const { filename, contentType, size } = req.body;
    const s3 = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      forcePathStyle: true,
    });

    const key = `${crypto.randomUUID()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return { url, key };
  });

  // Auth routes
  app.post('/register', {
    schema: {
      body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }),
      response: {
        200: z.object({ token: z.string(), verificationToken: z.string().optional() }),
      },
    },
  }, async (req, reply) => {
    const { email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    const token = app.jwt.sign({ id: user.id, email: user.email });
    reply.setCookie('token', token, cookieOptions);
    const verificationToken = crypto.randomUUID();
    await (app.redis as unknown as RedisClient | undefined)?.set(`verify:${verificationToken}`, user.id, { EX: 60 * 60 });
    return { token, verificationToken };
  });

  app.post('/login', {
    schema: {
      body: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      response: {
        200: z.object({ token: z.string() }),
        401: z.object({ message: z.string() })
      },
    },
  }, async (req, reply) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }
    if (!user.emailVerified) {
      return reply.status(401).send({ message: 'Email not verified' });
    }
    const token = app.jwt.sign({ id: user.id, email: user.email });
    reply.setCookie('token', token, cookieOptions);
    return { token };
  });

  app.post('/verify-email', {
    schema: {
      body: z.object({ token: z.string() }),
      response: {
        200: z.object({ success: z.boolean() }),
      },
    },
  }, async (req, reply) => {
    const { token } = req.body;
    const userId = await (app.redis as unknown as RedisClient | undefined)?.get(`verify:${token}`);
    if (!userId) {
      return reply.status(400).send({ success: false });
    }
    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    await (app.redis as unknown as RedisClient | undefined)?.del(`verify:${token}`);
    return { success: true };
  });

  app.post('/request-password-reset', {
    schema: {
      body: z.object({ email: z.string().email() }),
      response: { 200: z.object({ resetToken: z.string().optional() }) },
    },
  }, async (req) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { resetToken: undefined };
    const token = crypto.randomUUID();
    await (app.redis as unknown as RedisClient | undefined)?.set(`reset:${token}`, user.id, { EX: 60 * 60 });
    return { resetToken: token };
  });

  app.post('/reset-password', {
    schema: {
      body: z.object({ token: z.string(), password: z.string().min(6) }),
      response: { 200: z.object({ success: z.boolean() }) },
    },
  }, async (req, reply) => {
    const { token, password } = req.body;
    const userId = await (app.redis as unknown as RedisClient | undefined)?.get(`reset:${token}`);
    if (!userId) {
      return reply.status(400).send({ success: false });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await (app.redis as unknown as RedisClient | undefined)?.del(`reset:${token}`);
    return { success: true };
  });

  // Favourites
  app.get('/me/favourites', {
    preHandler: [app.authenticate],
  }, async (req) => {
    const favs = await prisma.favourite.findMany({
      where: { userId: req.user.id },
      include: { spot: true },
    });
    return favs.map((f) => f.spot);
  });

  app.post('/me/favourites', {
    preHandler: [app.authenticate],
    schema: {
      body: z.object({ spotId: z.string().uuid() }),
    },
  }, async (req) => {
    const { spotId } = req.body;
    await prisma.favourite.create({
      data: { userId: req.user.id, spotId },
    });
    return prisma.spot.findUnique({ where: { id: spotId } });
  });

  app.delete('/me/favourites/:spotId', {
    preHandler: [app.authenticate],
    schema: { params: z.object({ spotId: z.string().uuid() }) },
  }, async (req) => {
    const { spotId } = req.params;
    await prisma.favourite.delete({
      where: { userId_spotId: { userId: req.user.id, spotId } },
    });
    return { success: true };
  });

  // Spot schema
  const spotBody = z.object({
    name: z.string(),
    description: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    photos: z.array(z.string().url()).optional(),
    tags: z.array(z.string()).optional(),
    facilities: z.record(z.boolean()).optional(),
    category: z.enum(['park', 'garden', 'walk', 'lookout', 'playground', 'beach', 'other']),
    isPublished: z.boolean().optional(),
  });

  const routeBody = z.object({
    name: z.string(),
    description: z.string().optional(),
    distanceKm: z.number(),
    isPublished: z.boolean().optional(),
    path: z.array(z.tuple([z.number(), z.number()])),
    spotIds: z.array(z.string().uuid()).default([]),
  });

  // Spots CRUD
  app.post('/spots', {
    preHandler: [app.authenticate],
    schema: {
      body: spotBody,
    },
  }, async (req) => {
    const { name, description, lat, lng, photos = [], tags = [], facilities = {}, category, isPublished = false } = req.body;
    const id = crypto.randomUUID();
    await prisma.$executeRaw`INSERT INTO "Spot"(id, name, description, location, facilities, category, "isPublished", "userId") VALUES (${id}, ${name}, ${description}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${JSON.stringify(facilities)}, ${category}, ${isPublished}, ${req.user.id})`;

    if (photos.length) {
      await prisma.spotPhoto.createMany({
        data: photos.map((url) => ({ url, spotId: id })),
      });
    }

    for (const tagName of tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        create: { name: tagName },
        update: {},
      });
      await prisma.spotTag.create({ data: { spotId: id, tagId: tag.id } });
    }

    return { id };
  });

  app.get('/spots/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string().uuid() }),
    },
  }, async (req, reply) => {
    const { id } = req.params;
    const spot = await prisma.spot.findUnique({
      where: { id },
      include: { photos: true, tags: { include: { tag: true } } },
    });
    if (!spot) {
      return reply.status(404).send({ message: 'Not found' });
    }
    return spot;
  });

  app.get('/spots', {
    preHandler: [app.authenticate],
    schema: {
      querystring: z.object({
        q: z.string().optional(),
        tags: z.string().optional(),
        bbox: z.string().optional(),
        radius: z.number().optional(),
        center: z.string().optional(),
        category: z.enum(['park', 'garden', 'walk', 'lookout', 'playground', 'beach', 'other']).optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      }),
    },
  }, async (req) => {
    const { q, tags, bbox, radius, center, category, page = 1, pageSize = 20 } = req.query;
    let ids: { id: string }[] | null = null;

    if (radius && center) {
      const [lng, lat] = center.split(',').map(Number);
      ids = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Spot" WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${radius})
      `;
    } else if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      ids = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Spot" WHERE location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
      `;
    }

    const where: Record<string, unknown> = {};
    if (ids) where.id = { in: ids.map((r) => r.id) };
    if (q) where.name = { contains: q };
    if (category) where.category = category;
    if (tags) {
      const tagArr = tags.split(',');
      where.tags = { some: { tag: { name: { in: tagArr } } } };
    }

    return prisma.spot.findMany({
      where,
      include: { photos: true, tags: { include: { tag: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  });

  app.put('/spots/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: spotBody.partial(),
    },
  }, async (req, reply) => {
    const { id } = req.params;
    const { name, description, lat, lng } = req.body;
    const spot = await prisma.spot.findUnique({ where: { id } });
    if (!spot) return reply.status(404).send({ message: 'Not found' });
    if (spot.userId !== req.user.id) return reply.status(403).send({ message: 'Forbidden' });

    if (lat !== undefined && lng !== undefined) {
      await prisma.$executeRaw`UPDATE "Spot" SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326) WHERE id = ${id}`;
    }

    const updated = await prisma.spot.update({
      where: { id },
      data: { name, description },
    });
    return updated;
  });

  app.delete('/spots/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string().uuid() }),
    },
  }, async (req, reply) => {
    const { id } = req.params;
    const spot = await prisma.spot.findUnique({ where: { id } });
    if (!spot) return reply.status(404).send({ message: 'Not found' });
    if (spot.userId !== req.user.id) return reply.status(403).send({ message: 'Forbidden' });
    await prisma.spot.delete({ where: { id } });
    return { success: true };
  });

  async function addPath<T extends { id: string }>(route: T) {
    const [{ path }] = await prisma.$queryRaw<{ path: string }[]>`
      SELECT ST_AsGeoJSON(path) as path FROM "Route" WHERE id = ${route.id}
    `;
    return { ...route, path: JSON.parse(path) };
  }

  // Routes CRUD
  app.get('/routes', {
    preHandler: [app.authenticate],
  }, async () => {
    const routes = await prisma.route.findMany({
      include: { spots: { include: { spot: true }, orderBy: { order: 'asc' } } },
    });
    return Promise.all(routes.map((r) => addPath(r)));
  });

  app.post('/routes', {
    preHandler: [app.authenticate],
    schema: {
      body: routeBody,
    },
  }, async (req) => {
    const { name, description, distanceKm, isPublished = false, path, spotIds } = req.body;
    const id = crypto.randomUUID();
    const geojson = { type: 'LineString', coordinates: path };
    await prisma.$executeRaw`INSERT INTO "Route"(id, name, description, "distanceKm", "isPublished", path, "ownerId")
VALUES (${id}, ${name}, ${description}, ${distanceKm}, ${isPublished}, ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geojson)}), 4326), ${req.user.id})`;
    if (spotIds.length) {
      await prisma.routeSpot.createMany({
        data: spotIds.map((sid, idx) => ({ routeId: id, spotId: sid, order: idx })),
      });
    }
    const route = await prisma.route.findUnique({
      where: { id },
      include: { spots: { include: { spot: true }, orderBy: { order: 'asc' } } },
    });
    return addPath(route!);
  });

  app.get('/routes/:id', {
    preHandler: [app.authenticate],
    schema: { params: z.object({ id: z.string().uuid() }) },
  }, async (req, reply) => {
    const { id } = req.params;
    const route = await prisma.route.findUnique({
      where: { id },
      include: { spots: { include: { spot: true }, orderBy: { order: 'asc' } } },
    });
    if (!route) return reply.status(404).send({ message: 'Not found' });
    return addPath(route);
  });

  app.put('/routes/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: routeBody.partial(),
    },
  }, async (req, reply) => {
    const { id } = req.params;
    const { name, description, distanceKm, isPublished, path, spotIds } = req.body;
    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) return reply.status(404).send({ message: 'Not found' });
    if (route.ownerId !== req.user.id) return reply.status(403).send({ message: 'Forbidden' });

    if (path) {
      await prisma.$executeRaw`UPDATE "Route" SET path = ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify({ type: 'LineString', coordinates: path })}), 4326) WHERE id = ${id}`;
    }

    const updated = await prisma.route.update({
      where: { id },
      data: {
        name,
        description,
        distanceKm,
        isPublished,
        ...(spotIds
          ? {
              spots: {
                deleteMany: {},
                create: spotIds.map((sid, idx) => ({ spotId: sid, order: idx })),
              },
            }
          : {}),
      },
      include: { spots: { include: { spot: true }, orderBy: { order: 'asc' } } },
    });
    return addPath(updated);
  });

  app.delete('/routes/:id', {
    preHandler: [app.authenticate],
    schema: { params: z.object({ id: z.string().uuid() }) },
  }, async (req, reply) => {
    const { id } = req.params;
    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) return reply.status(404).send({ message: 'Not found' });
    if (route.ownerId !== req.user.id) return reply.status(403).send({ message: 'Forbidden' });
    await prisma.route.delete({ where: { id } });
    return { success: true };
  });

  // Tag management
  app.get('/tags', async () => prisma.tag.findMany());

  app.post('/tags', {
    preHandler: [app.authenticate],
    schema: {
      body: z.object({ name: z.string() }),
    },
  }, async (req) => {
    const { name } = req.body;
    const tag = await prisma.tag.create({ data: { name } });
    return tag;
  });

  // Voting
  app.post('/spots/:id/vote', {
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ value: z.number().int().refine((v) => Math.abs(v) === 1) }),
    },
  }, async (req) => {
    const { id } = req.params;
    const { value } = req.body;
    await prisma.vote.upsert({
      where: { userId_spotId: { userId: req.user.id, spotId: id } },
      create: { userId: req.user.id, spotId: id, value },
      update: { value },
    });
    const total = await prisma.vote.aggregate({
      _sum: { value: true },
      where: { spotId: id },
    });
    return { score: total._sum.value ?? 0 };
  });

  app.get('/reports', {
    preHandler: [app.authenticate, app.adminOnly],
  }, async () => {
    return prisma.report.findMany({ include: { spot: true } });
  });

  app.get('/moderation/queue', {
    preHandler: [app.authenticate, app.adminOnly],
  }, async () => {
    return prisma.report.findMany({ where: { status: 'pending' }, include: { spot: true } });
  });

  app.post('/reports/:id', {
    preHandler: [app.authenticate, app.adminOnly],
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ action: z.enum(['approve', 'reject']) }),
    },
  }, async (req) => {
    const { id } = req.params;
    const { action } = req.body;
    const status = action === 'approve' ? 'approved' : 'rejected';
    const report = await prisma.report.update({ where: { id }, data: { status }, include: { spot: true } });
    await prisma.auditLog.create({
      data: { reportId: report.id, userId: req.user.id, action },
    });
    if (action === 'approve') {
      await prisma.spot.update({ where: { id: report.spotId }, data: { isPublished: false } });
    }
    return report;

  });

  return app;
}

// augmentations
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    adminOnly: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: { id: string; email: string };
  }
}
