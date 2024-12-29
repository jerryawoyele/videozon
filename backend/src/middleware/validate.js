import { body, validationResult } from 'express-validator';
import { validationErrorResponse } from '../utils/apiResponse.js';
import logger from '../config/logger.js';

/**
 * Middleware to validate request using express-validator
 * @param {Array} validations - Array of express-validator validation chains
 */
export const validateRequest = (validations) => {
  return async (req, res, next) => {
    try {
      // Run all validations
      await Promise.all(validations.map(validation => validation.run(req)));

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Format validation errors
        const formattedErrors = errors.array().reduce((acc, error) => {
          if (!acc[error.path]) {
            acc[error.path] = [];
          }
          acc[error.path].push(error.msg);
          return acc;
        }, {});

        // Log validation errors
        logger.debug('Validation failed', { 
          path: req.path, 
          errors: formattedErrors 
        });

        return validationErrorResponse(res, formattedErrors);
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      next(error);
    }
  };
};

/**
 * Sanitize request body to prevent XSS attacks
 */
export const sanitizeRequest = (req, res, next) => {
  try {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key]
            .trim()
            .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
            .replace(/javascript:/gi, '') // Remove javascript: to prevent JS injection
            .replace(/on\w+=/gi, ''); // Remove event handlers
        }
      });
    }
    next();
  } catch (error) {
    logger.error('Request sanitization error:', error);
    next(error);
  }
};

/**
 * Common validation chains
 */
export const commonValidations = {
  id: body('id')
    .trim()
    .notEmpty()
    .withMessage('ID is required')
    .isMongoId()
    .withMessage('Invalid ID format'),

  email: body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  password: body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  name: body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  url: body('url')
    .trim()
    .optional()
    .isURL()
    .withMessage('Invalid URL format'),

  phone: body('phone')
    .trim()
    .optional()
    .matches(/^\+?[\d\s-]{10,}$/)
    .withMessage('Invalid phone number format')
};

/**
 * Combine multiple validation chains
 */
export const combineValidations = (...validations) => {
  return validations.flat();
}; 