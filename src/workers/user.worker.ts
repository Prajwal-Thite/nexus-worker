import { Worker } from 'bullmq';
import { handleUser } from '../domains/user/user.handler.js';
import type { UserJobData } from '../types.js';
import { connection } from '../lib/connection.js';
import { logger } from '../lib/logger.js';
import { workerJobsTotal, workerJobDuration } from '../lib/metrics.js';

export function createUserWorker(): Worker<UserJobData> {
  const worker = new Worker<UserJobData>('user-queue', handleUser, { connection });

  worker.on('active', (job) => {
    (job as typeof job & { _startTime?: number })._startTime = Date.now();
  });

  worker.on('completed', (job) => {
    const duration = Date.now() - ((job as typeof job & { _startTime?: number })._startTime ?? Date.now());
    workerJobDuration.observe({ queue: 'user-queue' }, duration);
    workerJobsTotal.inc({ queue: 'user-queue', status: 'success' });
    logger.info('job completed', { jobId: job.id, operation: job.name, queue: 'user-queue', duration });
  });

  worker.on('failed', (job, err) => {
    workerJobsTotal.inc({ queue: 'user-queue', status: 'failure' });
    logger.error('job failed', { jobId: job?.id, operation: job?.name, queue: 'user-queue', error: err.message });
  });

  return worker;
}
