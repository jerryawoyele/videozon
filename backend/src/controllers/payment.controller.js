import axios from 'axios';
import Payment from '../models/payment.model.js';
import Gig from '../models/gig.model.js';
import { successResponse, httpResponses } from '../utils/apiResponse.js';
import logger from '../config/logger.js';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const verifyPayment = async (req, res) => {
  try {
    const { reference, gigId } = req.body;

    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const { data } = response.data;

    if (data.status === 'success') {
      // Update gig payment status
      const gig = await Gig.findById(gigId);
      if (!gig) {
        return httpResponses.notFound(res, 'Gig not found');
      }

      // Create payment record
      const payment = new Payment({
        gig: gigId,
        amount: data.amount / 100, // Convert from kobo to naira
        reference: data.reference,
        status: 'completed',
        paymentMethod: 'paystack',
        metadata: {
          paystack: data
        }
      });

      await payment.save();

      // Update gig payment status
      gig.paymentStatus = 'paid';
      await gig.save();

      return successResponse(res, 200, 'Payment verified successfully', { payment });
    } else {
      return httpResponses.badRequest(res, 'Payment verification failed');
    }
  } catch (error) {
    logger.error('Payment verification error:', error);
    return httpResponses.serverError(res, 'Failed to verify payment');
  }
};

export const getPaymentsByGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    const payments = await Payment.find({ gig: gigId })
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Payments retrieved successfully', { payments });
  } catch (error) {
    logger.error('Get payments error:', error);
    return httpResponses.serverError(res, 'Failed to fetch payments');
  }
}; 