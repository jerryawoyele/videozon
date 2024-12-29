import Request from '../models/request.model.js';
import { ApiError } from '../middleware/error.js';
import { createNotification } from '../services/notification.service.js';
import { paginateResults } from '../utils/helpers.js';

export const createRequest = async (req, res) => {
  try {
    const request = new Request({
      ...req.body,
      organizer: req.user._id
    });

    await request.save();

    // Notify relevant professionals
    // TODO: Implement notification logic based on category/location

    res.success('Request created successfully', request);
  } catch (error) {
    throw new ApiError(400, 'Failed to create request', error);
  }
};

export const getRequests = async (req, res) => {
  try {
    const { category, status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    const { skip, limit: limitNum } = paginateResults(page, limit);

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .populate('organizer', 'name avatar')
        .skip(skip)
        .limit(limitNum)
        .sort('-createdAt'),
      Request.countDocuments(filter)
    ]);

    res.paginate(requests, page, limit, total);
  } catch (error) {
    throw new ApiError(400, 'Failed to fetch requests', error);
  }
};

export const getRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('organizer', 'name avatar')
      .populate('proposals.professional', 'name avatar rating');

    if (!request) {
      throw new ApiError(404, 'Request not found');
    }

    res.success('Request retrieved successfully', request);
  } catch (error) {
    throw new ApiError(400, 'Failed to retrieve request', error);
  }
};

export const submitProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, price, deliveryTime } = req.body;

    const request = await Request.findById(id);
    if (!request) {
      throw new ApiError(404, 'Request not found');
    }

    if (request.status !== 'open') {
      throw new ApiError(400, 'This request is no longer accepting proposals');
    }

    // Check if professional already submitted a proposal
    const existingProposal = request.proposals.find(
      p => p.professional.toString() === req.user._id.toString()
    );
    if (existingProposal) {
      throw new ApiError(400, 'You have already submitted a proposal');
    }

    request.proposals.push({
      professional: req.user._id,
      message,
      price,
      deliveryTime
    });

    await request.save();

    // Notify organizer
    await createNotification({
      recipient: request.organizer,
      type: 'new_proposal',
      title: 'New Proposal Received',
      message: `You received a new proposal for your request: ${request.title}`,
      metadata: { requestId: request._id }
    });

    res.success('Proposal submitted successfully');
  } catch (error) {
    throw new ApiError(400, 'Failed to submit proposal', error);
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await Request.findOneAndUpdate(
      { _id: id, organizer: req.user._id },
      { status },
      { new: true }
    );

    if (!request) {
      throw new ApiError(404, 'Request not found');
    }

    res.success('Request status updated successfully', request);
  } catch (error) {
    throw new ApiError(400, 'Failed to update request status', error);
  }
}; 