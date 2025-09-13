import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyRedis from '@fastify/redis';
import fastifyCookie from '@fastify/cookie';
import { PrismaClient, Spot } from '@prisma/client';
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export function buildServer() {
  const app = Fastify().withTypeProvider<ZodTypeProvider>();

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

  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  app.get('/', async () => ({ hello: 'world' }));

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
    reply.setCookie('token', token, { httpOnly: true, path: '/' });
    const verificationToken = crypto.randomUUID();
    await (app.redis as any)?.set(`verify:${verificationToken}`, user.id, { EX: 60 * 60 });
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
    reply.setCookie('token', token, { httpOnly: true, path: '/' });
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
    const userId = await (app.redis as any)?.get(`verify:${token}`);
    if (!userId) {
      return reply.status(400).send({ success: false });
    }
    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    await (app.redis as any)?.del(`verify:${token}`);
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
    await (app.redis as any)?.set(`reset:${token}`, user.id, { EX: 60 * 60 });
    return { resetToken: token };
  });

  app.post('/reset-password', {
    schema: {
      body: z.object({ token: z.string(), password: z.string().min(6) }),
      response: { 200: z.object({ success: z.boolean() }) },
    },
  }, async (req, reply) => {
    const { token, password } = req.body;
    const userId = await (app.redis as any)?.get(`reset:${token}`);
    if (!userId) {
      return reply.status(400).send({ success: false });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await (app.redis as any)?.del(`reset:${token}`);
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
  });

  // Spots CRUD
  app.post('/spots', {
    preHandler: [app.authenticate],
    schema: {
      body: spotBody,
    },
  }, async (req) => {
    const { name, description, lat, lng, photos = [], tags = [] } = req.body;
    const id = crypto.randomUUID();
    await prisma.$executeRaw`INSERT INTO "Spot"(id, name, description, location, "userId") VALUES (${id}, ${name}, ${description}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${req.user.id})`;

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
        lat: z.number().optional(),
        lng: z.number().optional(),
        radius: z.number().optional(),
      }),
    },
  }, async (req) => {
    const { lat, lng, radius } = req.query;
    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      const spots = await prisma.$queryRaw<Spot[]>`
        SELECT * FROM "Spot" WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${radius})
      `;
      return spots;
    }
    return prisma.spot.findMany({ include: { photos: true, tags: { include: { tag: true } } } });
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

  return app;
}

// augmentations
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: { id: string; email: string };
  }
}
