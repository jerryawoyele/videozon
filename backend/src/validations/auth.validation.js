import { body } from 'express-validator';

export const forgotPasswordSchema = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

export const resetPasswordSchema = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// ... other validation schemas 