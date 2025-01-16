import User from '../models/user.model.js';
import Event from '../models/event.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

export const getAllProfessionals = async (req, res) => {
  try {
    const professionals = await User.find({ role: 'professional' })
      .select('name email avatar bio services rating reviews')
      .sort({ rating: -1 });

    return successResponse(res, 200, 'Professionals retrieved successfully', { professionals });
  } catch (error) {
    logger.error('Get professionals error:', error);
    return httpResponses.serverError(res, 'Failed to fetch professionals');
  }
};

export const getProfessionalById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First get the professional's basic info
    const professional = await User.findOne({ _id: id, role: 'professional' })
      .select('name email avatar bio services rating');
    
    if (!professional) {
      console.log('Professional not found');
      return httpResponses.notFound(res, 'Professional not found');
    }

    // Get ratings and reviews from events
    const events = await Event.find({
      'professionals.professional': id,
      'professionals.rating': { $exists: true }
    })
    .select('professionals.$ organizer datetime')
    .populate('organizer', 'name avatar');

    // Format the reviews
    const reviews = events.map(event => ({
      rating: event.professionals[0].rating,
      review: event.professionals[0].review,
      organizer: event.organizer,
      date: event.datetime
    }));

    return successResponse(res, 200, 'Professional retrieved successfully', { 
      professional: {
        ...professional.toObject(),
        reviews
      }
    });
  } catch (error) {
    logger.error('Get professional details error:', error);
    return httpResponses.serverError(res, 'Failed to fetch professional details');
  }
};

export const getProfessionalGigs = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all events where the professional is involved and accepted
    const events = await Event.find({
      'professionals.professional': userId,
      'professionals.status': 'accepted'
    })
    .populate('organizer', 'name email avatar')
    .sort({ datetime: -1 });

    // Format the gigs data
    const gigs = events.map(event => {
      const professionalDetails = event.professionals.find(
        p => p.professional.toString() === userId
      );
      
      return {
        _id: event._id,
        title: event.title,
        datetime: event.datetime,
        location: event.location,
        organizer: event.organizer,
        service: professionalDetails.service,
        status: event.status
      };
    });

    return successResponse(res, 200, 'Professional gigs retrieved successfully', { gigs });
  } catch (error) {
    logger.error('Get professional gigs error:', error);
    return httpResponses.serverError(res, 'Failed to fetch professional gigs');
  }
};

export const createGig = async (req, res) => {
  try {
    const { eventId, service } = req.body;
    const userId = req.user.id;

    // Check if the user is a professional
    if (req.user.role !== 'professional') {
      return httpResponses.forbidden(res, 'Only professionals can create gigs');
    }

    // Check if the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return httpResponses.notFound(res, 'Event not found');
    }

    // Check if the professional is already part of the event
    const existingGig = event.professionals.find(
      p => p.professional.toString() === userId
    );
    if (existingGig) {
      return httpResponses.badRequest(res, 'You already have a gig for this event');
    }

    // Add the professional to the event
    event.professionals.push({
      professional: userId,
      service,
      status: 'pending'
    });

    await event.save();

    return successResponse(res, 201, 'Gig created successfully', { event });
  } catch (error) {
    logger.error('Create gig error:', error);
    return httpResponses.serverError(res, 'Failed to create gig');
  }
};

export const updateGig = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const event = await Event.findOne({
      _id: id,
      'professionals.professional': userId
    });

    if (!event) {
      return httpResponses.notFound(res, 'Gig not found');
    }

    // Update the professional's status
    const professional = event.professionals.find(
      p => p.professional.toString() === userId
    );
    professional.status = status;

    await event.save();

    return successResponse(res, 200, 'Gig updated successfully', { event });
  } catch (error) {
    logger.error('Update gig error:', error);
    return httpResponses.serverError(res, 'Failed to update gig');
  }
};

export const deleteGig = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await Event.findOne({
      _id: id,
      'professionals.professional': userId
    });

    if (!event) {
      return httpResponses.notFound(res, 'Gig not found');
    }

    // Remove the professional from the event
    event.professionals = event.professionals.filter(
      p => p.professional.toString() !== userId
    );

    await event.save();

    return successResponse(res, 200, 'Gig deleted successfully');
  } catch (error) {
    logger.error('Delete gig error:', error);
    return httpResponses.serverError(res, 'Failed to delete gig');
  }
};

export const getProfessionals = async (req, res) => {
  try {
    const { 
      services, 
      search, 
      rating, 
      availability, 
      location
    } = req.query;

    // Log current user info
    console.log('Current user:', {
      id: req.user.id,
      role: req.user.role,
      name: req.user.name
    });

    // Simple query to exclude current user
    const query = { 
      role: 'professional',
      _id: { $ne: req.user.id }
    };

    // Add other filters
    if (services && services !== '') {
      query.services = services;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    if (availability) {
      query.availability = availability;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    console.log('Query:', JSON.stringify(query, null, 2));

    let professionals = await User.find(query)
      .select('name avatar bio services rating availability location reviews')
      .sort({ rating: -1 });

    // Manual filter to ensure current user is excluded
    professionals = professionals.filter(prof => 
      prof._id.toString() !== req.user.id.toString()
    );

    console.log('Professionals after filtering:', professionals.map(p => ({
      id: p._id.toString(),
      name: p.name,
      isCurrentUser: p._id.toString() === req.user.id.toString()
    })));

    return res.status(200).json({
      success: true,
      message: 'Professionals retrieved successfully',
      data: {
        professionals
      }
    });
  } catch (error) {
    console.error('Get professionals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch professionals',
      error: error.message
    });
  }
};
