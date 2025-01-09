import Stripe from 'stripe';
import logger from '../config/logger.js';
import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';
import { createNotification } from './notification.service.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (orderId, amount, currency = 'ngn') => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to kobo
      currency,
      metadata: { orderId }
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Payment intent creation failed:', error);
    throw error;
  }
};

export const processPayment = async (orderId, paymentMethodId, amount) => {
  try {
    const order = await Order.findById(orderId)
      .populate('organizer')
      .populate('professional');

    const paymentIntent = await createPaymentIntent(orderId, amount);

    const payment = new Payment({
      order: orderId,
      payer: order.organizer._id,
      recipient: order.professional._id,
      amount,
      paymentMethod: 'card',
      paymentIntentId: paymentIntent.id
    });

    await payment.save();

    // Confirm the payment
    await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: paymentMethodId
    });

    // Update order status
    order.status = 'in_progress';
    await order.save();

    // Create notifications
    await createNotification({
      recipient: order.professional._id,
      type: 'payment',
      title: 'Payment Received',
      message: `Payment received for order #${order._id}`,
      metadata: { orderId }
    });

    return payment;
  } catch (error) {
    logger.error('Payment processing failed:', error);
    throw error;
  }
};

export const refundPayment = async (paymentId, reason) => {
  try {
    const payment = await Payment.findById(paymentId);
    
    const refund = await stripe.refunds.create({
      payment_intent: payment.paymentIntentId,
      reason
    });

    payment.status = 'refunded';
    payment.refundReason = reason;
    await payment.save();

    return refund;
  } catch (error) {
    logger.error('Payment refund failed:', error);
    throw error;
  }
};

export const getPaymentStatus = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status;
  } catch (error) {
    logger.error('Payment status check failed:', error);
    throw error;
  }
}; 