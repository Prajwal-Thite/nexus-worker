import http from 'http';
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({ register });

export const workerJobsTotal = new Counter({
  name:       'bullmq_worker_jobs_total',
  help:       'Total jobs processed by the worker',
  labelNames: ['queue', 'status'] as const,
  registers:  [register],
});

export const workerJobDuration = new Histogram({
  name:       'bullmq_worker_job_duration_ms',
  help:       'Duration of job processing in milliseconds',
  labelNames: ['queue'] as const,
  buckets:    [10, 50, 100, 250, 500, 1000, 2500, 5000],
  registers:  [register],
});

// internal — localhost only, for Alloy
export function startInternalMetricsServer(port = 9466): void {
  http.createServer(async (_req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  }).listen(port, '127.0.0.1', () => {
    console.log(`Metrics server (internal) ready at: http://localhost:${port}/metrics`);
  });
}

// public — bearer token protected, for external tools / AI
export function startPublicMetricsServer(port = 9467): void {
  http.createServer(async (req, res) => {
    const expected = `Bearer ${process.env.METRICS_TOKEN}`;

    if (!process.env.METRICS_TOKEN || req.headers.authorization !== expected) {
      res.writeHead(401);
      res.end('Unauthorized');
      return;
    }

    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  }).listen(port, () => {
    console.log(`Metrics server (public)   ready at: http://localhost:${port}/metrics`);
  });
}
