import { Worker } from 'bullmq';
import { handleComment } from '../domains/comment/comment.handler.js';
import type { CommentJobData } from '../types.js';
import { connection } from '../lib/connection.js';
import { logger } from '../lib/logger.js';
import { workerJobsTotal, workerJobDuration } from '../lib/metrics.js';

export function createCommentWorker(): Worker<CommentJobData> {
  const worker = new Worker<CommentJobData>('comment-queue', handleComment, { connection });

  worker.on('active', (job) => {
    (job as typeof job & { _startTime?: number })._startTime = Date.now();
  });

  worker.on('completed', (job) => {
    const duration = Date.now() - ((job as typeof job & { _startTime?: number })._startTime ?? Date.now());
    workerJobDuration.observe({ queue: 'comment-queue' }, duration);
    workerJobsTotal.inc({ queue: 'comment-queue', status: 'success' });
    logger.info('job completed', { jobId: job.id, operation: job.name, queue: 'comment-queue', duration });
  });

  worker.on('failed', (job, err) => {
    workerJobsTotal.inc({ queue: 'comment-queue', status: 'failure' });
    logger.error('job failed', { jobId: job?.id, operation: job?.name, queue: 'comment-queue', error: err.message });
  });

  return worker;
}
