import jwt from 'jsonwebtoken';
import { httpResponses } from '../utils/apiResponse.js';

export const validateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return httpResponses.unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    console.error('Token validation error:', error);
    return httpResponses.unauthorized(res, 'Invalid token');
  }
}; 