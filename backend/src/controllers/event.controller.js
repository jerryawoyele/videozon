import Event from '../models/event.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import logger from '../config/logger.js';
import NotificationService from '../services/notification.service.js';
import User from '../models/user.model.js';

export const createEvent = async (req, res) => {
  try {
    const eventData = JSON.parse(req.body.eventData);
    const userId = req.user.id;

    // Create the event
    const event = new Event({
      ...eventData,
      organizer: userId
    });

    await event.save();
    await event.populate('organizer', 'name'); // Populate organizer details

    // Create notifications for professionals if services are specified
    if (eventData.services && eventData.services.length > 0) {
      const professionals = await User.find({
        role: 'professional',
        services: { $in: eventData.services }
      });

      // Create notifications for each relevant professional
      for (const professional of professionals) {
        await NotificationService.create({
          recipient: professional._id,
          sender: userId,
          type: 'event_created',
          title: 'New Event Available',
          message: `New event "${event.title}" by ${event.organizer.name} requires ${eventData.services.join(', ')}`,
          eventId: event._id,
          metadata: {
            services: eventData.services,
            eventTitle: event.title,
            budget: event.budget,
            location: event.location,
            datetime: event.datetime
          }
        });
      }
    }

    return successResponse(res, 201, 'Event created successfully', { event });
  } catch (error) {
    console.error('Create event error:', error);
    return httpResponses.serverError(res, 'Failed to create event');
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findOne({ _id: id, organizer: req.user.id });

    if (!event) {
      return httpResponses.notFound(res, 'Event not found');
    }

    Object.assign(event, req.body);
    await event.save();
    
    // Create notification for event update
    await NotificationService.notifyEventUpdated(event);

    return successResponse(res, 200, 'Event updated successfully', { event });
  } catch (error) {
    logger.error('Update event error:', error);
    return httpResponses.serverError(res, 'Failed to update event');
  }
};

export const addProfessional = async (req, res) => {
  try {
    const { eventId, professionalId, service } = req.body;
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id });

    if (!event) {
      return httpResponses.notFound(res, 'Event not found');
    }

    // Check if professional is already added
    const existingProfessional = event.professionals.find(
      p => p.professional.toString() === professionalId
    );

    if (existingProfessional) {
      return httpResponses.badRequest(res, 'Professional already added to event');
    }

    // Add professional to event
    event.professionals.push({
      professional: professionalId,
      service,
      status: 'pending'
    });

    await event.save();
    await event.populate('professionals.professional', 'name');

    // Create notification for professional joining
    const professional = event.professionals.find(p => p.professional._id.toString() === professionalId);
    if (professional) {
      await NotificationService.notifyProfessionalJoined(event, professional.professional);
    }

    return successResponse(res, 200, 'Professional added successfully', { event });
  } catch (error) {
    logger.error('Add professional error:', error);
    return httpResponses.serverError(res, 'Failed to add professional');
  }
};

export const removeProfessional = async (req, res) => {
  try {
    const { eventId, professionalId } = req.params;
    const event = await Event.findOne({ _id: eventId, organizer: req.user.id })
      .populate('professionals.professional', 'name');

    if (!event) {
      return httpResponses.notFound(res, 'Event not found');
    }

    // Get professional details before removing
    const professional = event.professionals.find(p => p.professional._id.toString() === professionalId);
    if (!professional) {
      return httpResponses.notFound(res, 'Professional not found in event');
    }

    // Remove professional from event
    event.professionals = event.professionals.filter(
      p => p.professional._id.toString() !== professionalId
    );

    await event.save();

    // Create notification for professional leaving
    await NotificationService.notifyProfessionalLeft(event, professional.professional);

    return successResponse(res, 200, 'Professional removed successfully');
  } catch (error) {
    logger.error('Remove professional error:', error);
    return httpResponses.serverError(res, 'Failed to remove professional');
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const { search, status, startDate, endDate } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.datetime = {};
      if (startDate) query.datetime.$gte = new Date(startDate);
      if (endDate) query.datetime.$lte = new Date(endDate);
    }

    // First, update status of past events
    const now = new Date();
    await Event.updateMany(
      {
        datetime: { $lt: now },
        status: 'active'
      },
      {
        $set: { status: 'concluded' }
      }
    );

    const events = await Event.find(query)
      .populate('organizer', 'name email avatar')
      .populate('professionals.professional', 'name email avatar')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Events retrieved successfully', { events });
  } catch (error) {
    logger.error('Get all events error:', error);
    return httpResponses.serverError(res, 'Failed to fetch events');
  }
};

export const getEvents = async (req, res) => {
  try {
    const { search, status, startDate, endDate } = req.query;
    
    // Build query
    const query = { organizer: req.user.id };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.datetime = {};
      if (startDate) query.datetime.$gte = new Date(startDate);
      if (endDate) query.datetime.$lte = new Date(endDate);
    }

    // First, update status of past events
    const now = new Date();
    await Event.updateMany(
      {
        datetime: { $lt: now },
        status: 'active'
      },
      {
        $set: { status: 'concluded' }
      }
    );

    const events = await Event.find(query)
      .populate('organizer', 'name')
      .populate('professionals.professional', 'name')
      .sort({ datetime: -1 });

    return successResponse(res, 200, 'Events retrieved successfully', { events });
  } catch (error) {
    logger.error('Get events error:', error);
    return httpResponses.serverError(res, 'Failed to fetch events');
  }
};

export const getMyEvents = async (req, res) => {
  try {
    const { search, status, startDate, endDate, userId } = req.query;
    
    // Build query for events created by the user
    const query = { organizer: userId || req.user._id };
    
    if (search) {
      query.$and = [{
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.datetime = {};
      if (startDate) query.datetime.$gte = new Date(startDate);
      if (endDate) query.datetime.$lte = new Date(endDate);
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email avatar')
      .populate('professionals.professional', 'name email avatar')
      .sort({ datetime: -1 }); // Sort by event date

    return successResponse(res, 200, 'Events retrieved successfully', { events });
  } catch (error) {
    logger.error('Get my events error:', error);
    return httpResponses.serverError(res, 'Failed to get events');
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id)
      .populate('organizer', 'name email avatar')
      .populate('professionals.professional', 'name email avatar');

    if (!event) {
      return httpResponses.notFound(res, 'Event not found');
    }

    return successResponse(res, 200, 'Event retrieved successfully', { event });
  } catch (error) {
    logger.error('Get event error:', error);
    return httpResponses.serverError(res, 'Failed to fetch event');
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findOneAndDelete({ _id: id, organizer: req.user.id });

    if (!event) {
      return httpResponses.notFound(res, 'Event not found');
    }

    return successResponse(res, 200, 'Event deleted successfully');
  } catch (error) {
    logger.error('Delete event error:', error);
    return httpResponses.serverError(res, 'Failed to delete event');
  }
};
