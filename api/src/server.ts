import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';

export function buildServer() {
  const app = Fastify();
  // Initialize Prisma Client
  const prisma = new PrismaClient();
  app.decorate('prisma', prisma);

  app.get('/', async () => ({ hello: 'world' }));

  return app;
}
