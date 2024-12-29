import { body } from 'express-validator';
import { validateRequest, commonValidations } from './validate.js';
import logger from '../config/logger.js';

/**
 * Validation middleware for login requests
 */
export const validateLogin = validateRequest([
  commonValidations.email,
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
]);

/**
 * Validation middleware for registration requests
 */
export const validateRegistration = validateRequest([
  commonValidations.email,
  commonValidations.password,
  commonValidations.name,
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['professional', 'client'])
    .withMessage('Invalid role. Must be either professional or client')
]);

/**
 * Validation middleware for profile update requests
 */
export const validateProfileUpdate = validateRequest([
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('skills.*')
    .trim()
    .notEmpty()
    .withMessage('Skill cannot be empty'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  commonValidations.phone.optional(),
  commonValidations.url.optional()
]);

/**
 * Validation middleware for password change requests
 */
export const validatePasswordChange = validateRequest([
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required'),
  commonValidations.password
]);

/**
 * Validation middleware for email change requests
 */
export const validateEmailChange = validateRequest([
  commonValidations.email,
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required for email change verification')
]);

/**
 * Validation middleware for account deletion requests
 */
export const validateAccountDeletion = validateRequest([
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required to confirm account deletion')
]);

/**
 * Validation middleware for social links
 */
export const validateSocialLinks = validateRequest([
  body('linkedin')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid LinkedIn URL'),
  body('github')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid GitHub URL'),
  body('twitter')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid Twitter URL'),
  body('portfolio')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid portfolio URL')
]);

/**
 * Validation middleware for notification settings
 */
export const validateNotificationSettings = validateRequest([
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be true or false'),
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be true or false'),
  body('messageNotifications')
    .optional()
    .isBoolean()
    .withMessage('Message notifications must be true or false'),
  body('orderUpdates')
    .optional()
    .isBoolean()
    .withMessage('Order updates must be true or false')
]);

export const validateGig = [
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('category').trim().notEmpty(),
  body('packages').isArray().notEmpty(),
  handleValidationErrors
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
} 