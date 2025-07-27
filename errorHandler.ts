import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface ErrorResponse {
  message: string;
  stack?: string;
  details?: any;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'An unexpected error occurred';
  let details: any;

  // Handle custom API errors
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    if (err instanceof ValidationError) {
      details = err.details;
    }
  }
  // Handle Prisma-specific errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint failed
        statusCode = 409; // Conflict
        message = `A record with this value already exists.`;
        // Potentially extract the field name from err.meta.target
        if (err.meta && Array.isArray(err.meta.target)) {
           message = `A record with this ${err.meta.target.join(', ')} already exists.`;
        }
        break;
      case 'P2025': // Record to update not found
        statusCode = 404;
        message = 'The requested resource was not found.';
        break;
      default:
        statusCode = 400; // Bad Request for other known DB errors
        message = 'A database error occurred.';
        break;
    }
  }

  // Log the error
  logger.error(err.message, {
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  // Prepare response
  const response: ErrorResponse = { message };

  // Include stack trace in development only
  if (env.nodeEnv === 'development') {
    response.stack = err.stack;
  }
  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};
