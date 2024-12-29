import Gig from '../models/gig.model.js';
import { ApiError } from '../middleware/error.js';
import { uploadMultipleFiles } from '../services/upload.service.js';
import { paginateResults } from '../utils/helpers.js';

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
      .populate({
        path: 'reviews',
        populate: { path: 'reviewer', select: 'name avatar' }
      });

    if (!gig) {
      throw new ApiError(404, 'Gig not found');
    }

    res.success('Gig retrieved successfully', gig);
  } catch (error) {
    throw new ApiError(400, 'Failed to retrieve gig', error);
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