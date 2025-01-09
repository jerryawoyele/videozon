import Gig from '../models/gig.model.js';
import { ApiError } from '../middleware/error.js';
import { uploadMultipleFiles } from '../services/upload.service.js';
import { paginateResults } from '../utils/helpers.js';
import Event from '../models/event.model.js';
import logger from '../config/logger.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';

export const createGig = async (req, res) => {
  try {
    const { title, description, category, packages } = req.body;
    const images = req.files;

    // Upload images
    const imageUrls = await uploadMultipleFiles(images, 'gigs');

    const gig = new Gig({
      professional: req.user._id,
      title,
      description,
      category,
      packages: JSON.parse(packages),
      images: imageUrls
    });

    await gig.save();
    res.success('Gig created successfully', gig);
  } catch (error) {
    throw new ApiError(400, 'Failed to create gig', error);
  }
};

export const searchGigs = async (req, res) => {
  try {
    const { 
      query, 
      category, 
      minPrice, 
      maxPrice, 
      rating,
      page = 1,
      limit = 10 
    } = req.query;

    const filter = {};
    
    if (query) {
      filter.$text = { $search: query };
    }
    if (category) {
      filter.category = category;
    }
    if (minPrice || maxPrice) {
      filter['packages.price'] = {};
      if (minPrice) filter['packages.price'].$gte = Number(minPrice);
      if (maxPrice) filter['packages.price'].$lte = Number(maxPrice);
    }
    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    const { skip, limit: limitNum } = paginateResults(page, limit);

    const [gigs, total] = await Promise.all([
      Gig.find(filter)
        .populate('professional', 'name avatar rating')
        .skip(skip)
        .limit(limitNum)
        .sort('-createdAt'),
      Gig.countDocuments(filter)
    ]);

    res.paginate(gigs, page, limit, total);
  } catch (error) {
    throw new ApiError(400, 'Search failed', error);
  }
};

export const getGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('professional', 'name avatar rating bio completedGigs')
      .populate('event', 'title datetime location budget paymentStatus');

    if (!gig) {
      throw new ApiError(404, 'Gig not found');
    }

    return successResponse(res, 200, 'Gig retrieved successfully', { gig });
  } catch (error) {
    logger.error('Get gig error:', error);
    return httpResponses.serverError(res, 'Failed to retrieve gig');
  }
};

export const updateGig = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const images = req.files;

    const gig = await Gig.findOne({ _id: id, professional: req.user._id });
    
    if (!gig) {
      throw new ApiError(404, 'Gig not found');
    }

    // Upload new images if provided
    if (images?.length) {
      const imageUrls = await uploadMultipleFiles(images, 'gigs');
      updates.images = [...gig.images, ...imageUrls];
    }

    Object.assign(gig, updates);
    await gig.save();

    res.success('Gig updated successfully', gig);
  } catch (error) {
    throw new ApiError(400, 'Failed to update gig', error);
  }
};

export const deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findOneAndDelete({ 
      _id: req.params.id, 
      professional: req.user._id 
    });

    if (!gig) {
      throw new ApiError(404, 'Gig not found');
    }

    res.success('Gig deleted successfully');
  } catch (error) {
    throw new ApiError(400, 'Failed to delete gig', error);
  }
};

export const getGigsByProfessional = async (req, res) => {
  try {
    const userId = req.user.id;
    const gigs = await Gig.find({ professional: userId })
      .populate({
        path: 'event',
        select: 'title datetime location budget paymentStatus organizer',
        populate: {
          path: 'organizer',
          select: 'name avatar'
        }
      })
      .populate('professional', 'name avatar rating')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Professional gigs retrieved successfully', { gigs });
  } catch (error) {
    logger.error('Get professional gigs error:', error);
    return httpResponses.serverError(res, 'Failed to fetch professional gigs');
  }
};

export const getGigsByClient = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all events where the user is the organizer
    const events = await Event.find({ organizer: userId });
    const eventIds = events.map(event => event._id);

    // Find all gigs associated with these events
    const gigs = await Gig.find({ event: { $in: eventIds } })
      .populate({
        path: 'event',
        select: 'title datetime location budget paymentStatus organizer',
        populate: {
          path: 'organizer',
          select: 'name avatar'
        }
      })
      .populate('professional', 'name avatar rating')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Client gigs retrieved successfully', { gigs });
  } catch (error) {
    logger.error('Get client gigs error:', error);
    return httpResponses.serverError(res, 'Failed to fetch client gigs');
  }
}; 