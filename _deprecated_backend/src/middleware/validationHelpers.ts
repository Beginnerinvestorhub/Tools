import { Request, Response, NextFunction } from 'express';
import { ValidationErrorItem, ObjectSchema } from 'joi';

/**
 * Validate request body against a Joi schema.
 * Sends 400 response with error messages if validation fails.
 */
export const validateBody = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail: ValidationErrorItem) => detail.message);
      return res.status(400).json({ errors });
    }

    next();
  };
};

/**
 * Validate request params against a Joi schema.
 * Sends 400 response with error messages if validation fails.
 */
export const validateParams = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail: ValidationErrorItem) => detail.message);
      return res.status(400).json({ errors });
    }

    next();
  };
};

/**
 * Optionally: Validate query parameters
 */
export const validateQuery = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail: ValidationErrorItem) => detail.message);
      return res.status(400).json({ errors });
    }

    next();
  };
};
