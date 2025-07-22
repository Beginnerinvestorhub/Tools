import { Request, Response, NextFunction } from 'express';
import Joi, { ObjectSchema, ValidationErrorItem } from 'joi';

// Custom error class for validation errors
export class ValidationError extends Error {
  public statusCode: number;
  public details: ValidationErrorItem[] | any;

  constructor(message: string, details: ValidationErrorItem[] | any) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

// Validation middleware factory
export const validate = (schema: {
  body?: ObjectSchema;
  query?: ObjectSchema;
  params?: ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, any> = {};

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        errors.body = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        errors.query = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));
      }
    }

    // Validate route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        errors.params = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        }));
      }
    }

    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'The request contains invalid data',
        details: errors,
        timestamp: new Date().toISOString(),
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
  email: (str: string): string => {
    return str.toLowerCase().trim();
  },

  // Remove extra whitespace
  whitespace: (str: string): string => {
    return str.replace(/\s+/g, ' ').trim();
  }
};

export { validate, ValidationError, sanitize };
