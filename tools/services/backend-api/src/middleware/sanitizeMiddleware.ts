// beginnerinvestorhub/tools/services/backend-api/src/middleware/sanitizeMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

/**
 * Middleware to sanitize user inputs to prevent XSS attacks
 * @param req The Express request object
 * @param res The Express response object
 * @param next The Express next middleware function
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize request query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize request params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize an object's properties
 * @param obj The object to sanitize
 * @returns The sanitized object
 */
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Sanitize string values
    return DOMPurify.sanitize(obj, {
      ALLOWED_TAGS: [], // Disallow all HTML tags
      ALLOWED_ATTR: [], // Disallow all attributes
    });
  }

  if (Array.isArray(obj)) {
    // Recursively sanitize array elements
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    // Recursively sanitize object properties
    const sanitizedObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitizedObj[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitizedObj;
  }

  // Return primitive values as is
  return obj;
};

export default sanitizeInput;
