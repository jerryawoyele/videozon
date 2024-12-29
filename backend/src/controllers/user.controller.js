import User from '../models/user.model.js';
import Event from '../models/event.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import logger from '../config/logger.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { cleanupUpload } from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';

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
      .select('name email avatar bio services rating portfolio availability');

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

    return successResponse(res, 200, 'Profile retrieved successfully', {
      profile: {
        ...user.toObject(),
        reviews
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    return httpResponses.serverError(res, 'Failed to fetch profile');
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, services } = req.body;
    const avatar = req.file;

    const user = await User.findById(req.user.id);
    if (!user) {
      return httpResponses.notFound(res, 'User not found');
    }

    // Update basic info
    user.name = name;
    user.bio = bio;
    user.services = JSON.parse(services);

    // Update avatar if provided
    if (avatar) {
      const result = await uploadToCloudinary(avatar.path);
      user.avatar = {
        url: result.secure_url,
        publicId: result.public_id
      };
      cleanupUpload(avatar.path);
    }

    await user.save();

    return successResponse(res, 200, 'Profile updated successfully', {
      profile: user
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    return httpResponses.serverError(res, 'Failed to update profile');
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { isOnline, lastSeen } = req.body;
    
    await User.findByIdAndUpdate(req.user.id, {
      isOnline,
      lastSeen: isOnline ? undefined : (lastSeen || new Date())
    });

    return successResponse(res, 200, 'Status updated successfully');
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