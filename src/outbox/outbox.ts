import type { InputJsonValue } from '../generated/prisma/internal/prismaNamespace.js';
import prisma from '../db/prisma.js';

export async function writeOutboxAndNotify(eventType: string, payload: InputJsonValue): Promise<void> {
  //runs mutiple db operation as single atomic unit, if any operation fails, the entire transaction will be rolled back
  await prisma.$transaction([
    prisma.outbox.create({ data: { eventType, payload } }),
    prisma.$executeRaw`SELECT pg_notify('event_created', ${eventType})`,
  ]);
}
