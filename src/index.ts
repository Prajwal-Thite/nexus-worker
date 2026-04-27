import { connectWithRetry } from './db/prisma.js';
import { logger } from './lib/logger.js';
import { startInternalMetricsServer, startPublicMetricsServer } from './lib/metrics.js';
import { startWorkers } from './workers/workers.js';

// alternative: strict 3-file approach (kept for reference)
// import { createPostWorker }    from './workers/post.worker.js';
// import { createUserWorker }    from './workers/user.worker.js';
// import { createCommentWorker } from './workers/comment.worker.js';
// createPostWorker();
// createUserWorker();
// createCommentWorker();

await connectWithRetry();
startInternalMetricsServer();
startPublicMetricsServer();
startWorkers();

logger.info('worker listening on queues: post-queue, user-queue, comment-queue');
