import { Job } from 'bullmq';
import type { CommentJobData } from '../../types.js';
import prisma from '../../db/prisma.js';
import { writeOutboxAndNotify } from '../../outbox/outbox.js';

export async function handleComment(job: Job<CommentJobData>): Promise<void> {
  const data = job.data;

  if (job.name === 'comment-created') {
    const comment = await prisma.comment.create({
      data: { text: data.text!, postId: data.postId!, authorId: data.authorId! },
    });
    await writeOutboxAndNotify(job.name, { commentId: comment.id, text: comment.text, postId: comment.postId });

  } else if (job.name === 'comment-deleted') {
    await prisma.comment.delete({ where: { id: data.id } });
    await writeOutboxAndNotify(job.name, { commentId: data.id });
  }
}
