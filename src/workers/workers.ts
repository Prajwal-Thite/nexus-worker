import { Worker, Processor } from 'bullmq';
import { handlePost }    from '../domains/post/post.handler.js';
import { handleUser }    from '../domains/user/user.handler.js';
import { handleComment } from '../domains/comment/comment.handler.js';
import { connection } from '../lib/connection.js';
import { logger } from '../lib/logger.js';
import { workerJobsTotal, workerJobDuration } from '../lib/metrics.js';

type QueueName = 'post-queue' | 'user-queue' | 'comment-queue';

function createWorker<T>(queue: QueueName, handler: Processor<T>): Worker<T> {
  const worker = new Worker<T>(queue, handler, { connection });

  worker.on('active', (job) => {
    (job as typeof job & { _startTime?: number })._startTime = Date.now(); //added _startTime property to job object to track when the job started processing
  });

  worker.on('completed', (job) => {
    const duration = Date.now() - ((job as typeof job & { _startTime?: number })._startTime ?? Date.now()); //cast type are tmeporsry and are not remembered by typescript thats why we write this again to convice typescript about this.
    workerJobDuration.observe({ queue }, duration);
    workerJobsTotal.inc({ queue, status: 'success' });
    logger.info('job completed', { jobId: job.id, operation: job.name, queue, duration });
  });

  worker.on('failed', (job, err) => {
    workerJobsTotal.inc({ queue, status: 'failure' });
    logger.error('job failed', { jobId: job?.id, operation: job?.name, queue, error: err.message }); //null handler (read down below) prevents crash if job is null
  });

  // job.id
  // if job is null → TypeError: Cannot read property 'id' of null
  // ← crashes your app

  //  BullMQ types job as Job | undefined in the failed event — meaning in rare edge cases it can be undefined (e.g. if the
  // job was removed from Redis before the failure was recorded). So ?. protects against that crash.

  return worker;
}

export function startWorkers(): void {
  const configs: { queue: QueueName; handler: Processor }[] = [
    { queue: 'post-queue',    handler: handlePost    },
    { queue: 'user-queue',    handler: handleUser    },
    { queue: 'comment-queue', handler: handleComment },
  ];
  configs.forEach(({ queue, handler }) => createWorker(queue, handler));
}
