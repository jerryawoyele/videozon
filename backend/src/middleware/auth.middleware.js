import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { httpResponses } from '../utils/apiResponse.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return httpResponses.unauthorized(res, 'Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return httpResponses.unauthorized(res, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return httpResponses.unauthorized(res, 'Invalid token');
    }
    return httpResponses.serverError(res, 'Authentication error');
  }
};
