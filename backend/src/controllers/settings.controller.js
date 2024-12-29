import User from '../models/user.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import logger from '../config/logger.js';
import bcrypt from 'bcryptjs';

export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    return successResponse(res, 200, 'Settings retrieved successfully', {
      settings: {
        emailNotifications: user.settings?.emailNotifications ?? true,
        pushNotifications: user.settings?.pushNotifications ?? true,
        marketingEmails: user.settings?.marketingEmails ?? false,
        twoFactorAuth: user.settings?.twoFactorAuth ?? false
      }
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    return httpResponses.serverError(res, 'Failed to get settings');
  }
};

export const updateSettings = async (req, res) => {
  try {
    const {
      emailNotifications,
      pushNotifications,
      marketingEmails,
      twoFactorAuth,
      currentPassword,
      newPassword
    } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    // Update settings
    user.settings = {
      emailNotifications: emailNotifications ?? user.settings?.emailNotifications ?? true,
      pushNotifications: pushNotifications ?? user.settings?.pushNotifications ?? true,
      marketingEmails: marketingEmails ?? user.settings?.marketingEmails ?? false,
      twoFactorAuth: twoFactorAuth ?? user.settings?.twoFactorAuth ?? false
    };

    // Handle password change if provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return httpResponses.badRequest(res, 'Current password is incorrect');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    return successResponse(res, 200, 'Settings updated successfully', {
      settings: user.settings
    });
  } catch (error) {
    logger.error('Update settings error:', error);
    return httpResponses.serverError(res, 'Failed to update settings');
  }
};
