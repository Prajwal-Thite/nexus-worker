import { Worker } from 'bullmq';
import { handlePost } from '../domains/post/post.handler.js';
import type { PostJobData } from '../types.js';
import { connection } from '../lib/connection.js';
import { logger } from '../lib/logger.js';
import { workerJobsTotal, workerJobDuration } from '../lib/metrics.js';

export function createPostWorker(): Worker<PostJobData> {
  const worker = new Worker<PostJobData>('post-queue', handlePost, { connection });

  worker.on('active', (job) => {
    (job as typeof job & { _startTime?: number })._startTime = Date.now();
  });

  worker.on('completed', (job) => {
    const duration = Date.now() - ((job as typeof job & { _startTime?: number })._startTime ?? Date.now());
    workerJobDuration.observe({ queue: 'post-queue' }, duration);
    workerJobsTotal.inc({ queue: 'post-queue', status: 'success' });
    logger.info('job completed', { jobId: job.id, operation: job.name, queue: 'post-queue', duration });
  });

  worker.on('failed', (job, err) => {
    workerJobsTotal.inc({ queue: 'post-queue', status: 'failure' });
    logger.error('job failed', { jobId: job?.id, operation: job?.name, queue: 'post-queue', error: err.message });
  });

  return worker;
}
