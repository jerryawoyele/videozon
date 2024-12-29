import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import logger from '../config/logger.js';

export const generateToken = (userId) => {
  try {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  } catch (error) {
    logger.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
};

export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Password comparison error:', error);
    throw new Error('Failed to compare passwords');
  }
};

export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
}; 