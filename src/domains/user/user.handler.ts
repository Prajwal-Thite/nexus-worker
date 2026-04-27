import { Job } from 'bullmq';
import type { UserJobData } from '../../types.js';
import prisma from '../../db/prisma.js';
import { writeOutboxAndNotify } from '../../outbox/outbox.js';

export async function handleUser(job: Job<UserJobData>): Promise<void> {
  const data = job.data;

  if (job.name === 'user-created') {
    const user = await prisma.user.create({
      data: { name: data.name!, email: data.email! },
    });
    await writeOutboxAndNotify(job.name, { userId: user.id, name: user.name, email: user.email });

  } else if (job.name === 'user-deleted') {
    const { count } = await prisma.user.deleteMany({
      where: {
        OR: [
          data.id   ? { id: data.id }     : {},
          data.name ? { name: data.name } : {},
        ],
      },
    });
    if (count === 0) throw new Error('No user found to delete');
    await writeOutboxAndNotify(job.name, { deleted: count });
  }
}
