import { Job } from 'bullmq';
import type { PostJobData } from '../../types.js';
import prisma from '../../db/prisma.js';
import { writeOutboxAndNotify } from '../../outbox/outbox.js';

export async function handlePost(job: Job<PostJobData>): Promise<void> {
  const data = job.data;

  if (job.name === 'post-created') {
    const post = await prisma.post.create({
      data: { title: data.title!, body: data.body!, authorId: data.authorId! },
    });
    await writeOutboxAndNotify(job.name, { postId: post.id, title: post.title, body: post.body, authorId: post.authorId });

  } else if (job.name === 'post-updated') {
    const post = await prisma.post.update({
      where: { id: data.id },
      data:  { title: data.title, body: data.body },
    });
    await writeOutboxAndNotify(job.name, { postId: post.id, title: post.title, body: post.body });

  } else if (job.name === 'post-deleted') {
    await prisma.post.delete({ where: { id: data.id } });
    await writeOutboxAndNotify(job.name, { postId: data.id });
  }
}
