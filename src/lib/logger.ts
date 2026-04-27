import winston from 'winston';
import LokiTransport from 'winston-loki';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? '  ' + JSON.stringify(meta) : '';
        return `${timestamp} [${level}] ${message}${metaStr}`;
      }),
    ),
  }),
];

const stringifyMetadata = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (key === 'level' || key === 'message' || key === 'timestamp') continue;
    const val = (info as Record<string, unknown>)[key];
    if (typeof val === 'object' && val !== null) {
      (info as Record<string, unknown>)[key] = JSON.stringify(val);
    } else if (typeof val === 'number') {
      (info as Record<string, unknown>)[key] = String(val);
    }
  }
  return info;
});

if (process.env.LOKI_URL) {
  transports.push(
    new LokiTransport({
      host: process.env.LOKI_URL,
      basicAuth: `${process.env.LOKI_USERNAME}:${process.env.LOKI_PASSWORD}`,
      labels: { app: 'stage-worker' },
      json: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        stringifyMetadata(),
      ),
    }),
  );
}

export const logger = winston.createLogger({
  level: 'info',
  transports,
});
