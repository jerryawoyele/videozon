import User from '../models/user.model.js';
import Event from '../models/event.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import logger from '../config/logger.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { cleanupUpload } from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';
import axios from 'axios';

export const getProfessionals = async (req, res) => {
  try {
    const { search, service } = req.query;
    
    let query = { role: 'professional' };

    // Add search conditions
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    // Add service filter
    if (service) {
      query.services = service;
    }

    const professionals = await User.find(query)
      .select('name email avatar bio services completedEvents rating')
      .sort({ rating: -1 });

    // Get additional stats for each professional
    const professionalsWithStats = await Promise.all(
      professionals.map(async (prof) => {
        const completedEvents = await Event.countDocuments({
          'professionals.professional': prof._id,
          'professionals.status': 'completed'
        });

        return {
          ...prof.toObject(),
          completedEvents
        };
      })
    );

    return successResponse(res, 200, 'Professionals retrieved successfully', { 
      professionals: professionalsWithStats 
    });
  } catch (error) {
    logger.error('Get professionals error:', error);
    return httpResponses.serverError(res, 'Failed to fetch professionals');
  }
};

export const getProfessionalProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const professional = await User.findOne({ _id: id, role: 'professional' })
      .select('name email avatar bio services completedEvents rating');

    if (!professional) {
      return httpResponses.notFound(res, 'Professional not found');
    }

    // Get professional's completed events
    const completedEvents = await Event.find({
      'professionals.professional': id,
      'professionals.status': 'completed'
    })
    .select('title datetime location')
    .sort({ datetime: -1 })
    .limit(5);

    // Get ratings and reviews
    const events = await Event.find({
      'professionals.professional': id,
      'professionals.rating': { $exists: true }
    })
    .select('professionals.$ organizer')
    .populate('organizer', 'name avatar');

    const reviews = events.map(event => ({
      rating: event.professionals[0].rating,
      review: event.professionals[0].review,
      organizer: event.organizer,
      date: event.professionals[0].ratedAt
    }));

    return successResponse(res, 200, 'Professional profile retrieved successfully', {
      professional: {
        ...professional.toObject(),
        completedEvents,
        reviews
      }
    });
  } catch (error) {
    logger.error('Get professional profile error:', error);
    return httpResponses.serverError(res, 'Failed to fetch professional profile');
  }
};

export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const professional = await User.findById(id);
    if (!professional || professional.role !== 'professional') {
      return httpResponses.notFound(res, 'Professional not found');
    }

    // Add review to the event where this professional provided service
    const event = await Event.findOne({
      'professionals.professional': id,
      organizer: req.user.id,
      status: 'completed'
    });

    if (!event) {
      return httpResponses.badRequest(res, 'You can only review professionals after event completion');
    }

    const professionalIndex = event.professionals.findIndex(
      p => p.professional.toString() === id
    );

    event.professionals[professionalIndex].rating = rating;
    event.professionals[professionalIndex].review = review;
    event.professionals[professionalIndex].ratedAt = new Date();

    await event.save();

    // Update professional's average rating
    const events = await Event.find({
      'professionals.professional': id,
      'professionals.rating': { $exists: true }
    });

    const ratings = events.map(e => 
      e.professionals.find(p => p.professional.toString() === id).rating
    );

    professional.rating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await professional.save();

    return successResponse(res, 200, 'Review added successfully');
  } catch (error) {
    logger.error('Add review error:', error);
    return httpResponses.serverError(res, 'Failed to add review');
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    
    if (!Array.isArray(availability)) {
      return httpResponses.badRequest(res, 'Availability must be an array');
    }

    // Validate each availability entry
    for (const slot of availability) {
      if (!slot.date || !Array.isArray(slot.timeSlots)) {
        return httpResponses.badRequest(res, 'Invalid availability format');
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    // Update user's availability
    user.availability = availability;
    await user.save();

    return successResponse(res, 200, 'Availability updated successfully', {
      availability: user.availability
    });
  } catch (error) {
    logger.error('Update availability error:', error);
    return httpResponses.serverError(res, 'Failed to update availability');
  }
};

export const getAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    return successResponse(res, 200, 'Availability retrieved successfully', {
      availability: user.availability || []
    });
  } catch (error) {
    logger.error('Get availability error:', error);
    return httpResponses.serverError(res, 'Failed to fetch availability');
  }
};

export const addPortfolioItem = async (req, res) => {
  try {
    const { title, description, image } = req.body;

    console.log('Received portfolio data:', {
      title,
      description,
      imageReceived: !!image
    });

    if (!title || !image) {
      return httpResponses.badRequest(res, 'Title and image are required');
    }

    // Make sure user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    try {
      // Upload base64 image to Cloudinary
      const result = await cloudinary.uploader.upload(image, {
        folder: 'portfolio',
        resource_type: 'auto'
      });

      console.log('Cloudinary result:', result);

      // Add to portfolio
      user.portfolio.push({
        title,
        description,
        image: {
          url: result.secure_url,
          publicId: result.public_id
        }
      });

      await user.save();

      return successResponse(res, 201, 'Portfolio item added successfully', {
        portfolio: user.portfolio
      });
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      throw uploadError;
    }
  } catch (error) {
    console.error('Add portfolio item error details:', error);
    logger.error('Add portfolio item error:', error);
    return httpResponses.serverError(res, 'Failed to add portfolio item');
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('name email avatar bio services rating completedEvents portfolio availability role');

    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    // Get ratings and reviews
    const events = await Event.find({
      'professionals.professional': user._id,
      'professionals.rating': { $exists: true }
    })
    .select('professionals.$ organizer')
    .populate('organizer', 'name avatar');

    const reviews = events.map(event => ({
      rating: event.professionals[0].rating,
      review: event.professionals[0].review,
      organizer: event.organizer,
      date: event.professionals[0].ratedAt
    }));

    // Calculate completed events
    const completedEvents = await Event.countDocuments({
      'professionals.professional': user._id,
      'professionals.status': 'completed'
    });

    const userDetails = {
      ...user.toObject(),
      reviews,
      completedEvents,
      avatarUrl: user.avatar?.url || user.defaultAvatar
    };

    return successResponse(res, 200, 'Profile retrieved successfully', {
      profile: userDetails
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    return httpResponses.serverError(res, 'Failed to fetch profile');
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Received request body:', req.body);
    
    // Parse services from string back to array if it exists
    let services = [];
    if (req.body.services) {
      try {
        services = JSON.parse(req.body.services);
        console.log('Parsed services:', services);
      } catch (error) {
        console.error('Error parsing services:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid services format'
        });
      }
    }

    const updateData = {
      name: req.body.name,
      bio: req.body.bio,
      services: services
    };

    console.log('Update data being sent to DB:', updateData);

    // If there's an avatar file, add it to the update
    if (req.file) {
      updateData.avatar = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log('Updated user from DB:', updatedUser);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        profile: {
          name: updatedUser.name,
          bio: updatedUser.bio,
          services: updatedUser.services,
          avatarUrl: updatedUser.avatarUrl
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { isOnline, lastSeen } = req.body;
    const userId = req.user.id;
    
    const updatedUser = await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: isOnline ? undefined : (lastSeen || new Date())
    }, { new: true });

    // Emit user status update through socket
    const io = req.app.get('io');
    if (io) {
      io.emit('user:status', {
        userId,
        isOnline,
        lastSeen: updatedUser.lastSeen
      });
    }

    return successResponse(res, 200, 'Status updated successfully', {
      isOnline: updatedUser.isOnline,
      lastSeen: updatedUser.lastSeen
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    return httpResponses.serverError(res, 'Failed to update status');
  }
};

export const getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('isOnline lastSeen');
    
    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    return successResponse(res, 200, 'User status retrieved successfully', {
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    });
  } catch (error) {
    logger.error('Get user status error:', error);
    return httpResponses.serverError(res, 'Failed to get user status');
  }
};

export const getPortfolio = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    return successResponse(res, 200, 'Portfolio retrieved successfully', {
      portfolio: user.portfolio || []
    });
  } catch (error) {
    logger.error('Get portfolio error:', error);
    return httpResponses.serverError(res, 'Failed to fetch portfolio');
  }
};

export const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('settings');

    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    // Return default settings if none exist
    const settings = user.settings || {
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      twoFactorAuth: false
    };

    return successResponse(res, 200, 'Settings retrieved successfully', { settings });
  } catch (error) {
    console.error('Get settings error:', error);
    return httpResponses.serverError(res, 'Failed to fetch settings');
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      emailNotifications,
      pushNotifications,
      marketingEmails,
      twoFactorAuth,
      currentPassword,
      newPassword,
      payment: {
        accountNumber,
        bankCode,
        bankName,
        accountName,
        businessName,
        mobileMoneyNumber,
        mobileMoneyProvider
      }
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    // Update settings
    user.settings = {
      ...user.settings,
      emailNotifications,
      pushNotifications,
      marketingEmails,
      twoFactorAuth
    };

    // Update payment info
    user.paymentInfo = {
      ...user.paymentInfo,
      accountNumber,
      bankCode,
      bankName,
      accountName,
      businessName,
      mobileMoneyNumber,
      mobileMoneyProvider
    };

    // Handle password change if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return httpResponses.badRequest(res, 'Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
    }

    await user.save();

    return successResponse(res, 200, 'Settings updated successfully', {
      settings: user.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return httpResponses.serverError(res, 'Failed to update settings');
  }
};

export const verifyBankAccount = async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;
    
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    if (response.data.status) {
      return successResponse(res, 200, 'Bank account verified', {
        accountName: response.data.data.account_name
      });
    }

    return httpResponses.badRequest(res, 'Invalid bank account details');
  } catch (error) {
    console.error('Bank verification error:', error);
    return httpResponses.serverError(res, 'Failed to verify bank account');
  }
};

export const getBanks = async (req, res) => {
  try {
    const response = await axios.get('https://api.paystack.co/bank', {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    if (response.data.status) {
      return successResponse(res, 200, 'Banks retrieved successfully', {
        banks: response.data.data
      });
    }

    return httpResponses.badRequest(res, 'Failed to fetch banks');
  } catch (error) {
    console.error('Get banks error:', error);
    return httpResponses.serverError(res, 'Failed to fetch banks');
  }
};

export const getProfessionalDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const professional = await User.findOne({ 
      _id: id,
      role: 'professional'
    })
    .select('name email avatar bio services rating isOnline lastSeen')
    .lean();

    if (!professional) {
      return httpResponses.notFound(res, 'Professional not found');
    }

    return successResponse(res, 200, 'Professional details retrieved successfully', {
      professional
    });
  } catch (error) {
    logger.error('Get professional details error:', error);
    return httpResponses.serverError(res, 'Failed to fetch professional details');
  }
}; 