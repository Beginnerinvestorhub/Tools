import { env } from '../config/env';

const levels: { [key: string]: number } = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const currentLevel = levels[env.logLevel] ?? levels.info;

const log = (level: string, message: string, meta?: any) => {
  if (levels[level] > currentLevel) return;

  const timestamp = new Date().toISOString();
  const logObject = {
    timestamp,
    level,
    message,
    ...meta,
  };

  if (env.nodeEnv === 'production') {
    console.log(JSON.stringify(logObject));
  } else {
    // Pretty print in development
    console.log(`${timestamp} [${level.toUpperCase()}]: ${message}`, meta || '');
  }
};

export const logger = {
  error: (message: string, meta?: any) => log('error', message, meta),
  warn: (message: string, meta?: any) => log('warn', message, meta),
  info: (message: string, meta?: any) => log('info', message, meta),
  http: (message: string, meta?: any) => log('http', message, meta),
  debug: (message: string, meta?: any) => log('debug', message, meta),
};