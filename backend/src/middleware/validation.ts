import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Custom error class for validation errors
export class ValidationError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, details: any) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

// Validation middleware factory
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: any = {};

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { 
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });
      if (error) {
        errors.body = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { 
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });
      if (error) {
        errors.query = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
      }
    }

    // Validate route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { 
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });
      if (error) {
        errors.params = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
      }
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'The request contains invalid data',
        details: errors,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

// Sanitization helpers
export const sanitize = {
  // Remove HTML tags and dangerous characters
  html: (str: string): string => {
    return str.replace(/<[^>]*>/g, '').trim();
  },

  // Normalize email addresses
  email: (email: string): string => {
    return email.toLowerCase().trim();
  },

  // Sanitize phone numbers
  phone: (phone: string): string => {
    return phone.replace(/[^\d+\-\(\)\s]/g, '').trim();
  },

  // Remove SQL injection patterns
  sql: (str: string): string => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;)/g,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi
    ];
    
    let sanitized = str;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
  }
};

// Rate limiting validation
export const validateRateLimit = (windowMs: number, max: number, message?: string) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < windowStart) {
        requests.delete(key);
      }
    }
    
    const clientData = requests.get(clientId);
    
    if (!clientData) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (clientData.count >= max) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: message || `Too many requests. Try again in ${Math.ceil(windowMs / 1000)} seconds.`,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    clientData.count++;
    next();
  };
};

// Global error handler for validation errors
export const validationErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({
      error: error.name,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString()
    });
  }
  
  next(error);
};
