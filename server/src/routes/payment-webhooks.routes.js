/**
 * Payment Webhook Routes
 * Handle webhooks from payment gateways
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const prisma = require('../config/database');
const asyncHandler = require('express-async-handler');

// Middleware to capture raw body for webhook verification
router.use(express.raw({ type: 'application/json' }));

/**
 * @route   POST /api/payments/webhook/stripe
 * @desc    Stripe webhook handler
 * @access  Public (webhook)
 */
router.post(
  '/stripe',
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const gateway = await prisma.paymentGateway.findFirst({
      where: { provider: 'STRIPE', isEnabled: true }
    });

    if (!gateway) {
      return res.status(400).json({ error: 'Stripe gateway not configured' });
    }

    const event = paymentService.verifyStripeWebhook(
      req.body,
      signature,
      gateway
    );

    if (!event) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentId = session.metadata.paymentId;

      if (paymentId) {
        await paymentService.processSuccessfulPayment(paymentId, event.data);
      }
    }

    res.json({ received: true });
  })
);

/**
 * @route   POST /api/payments/webhook/paymob
 * @desc    Paymob webhook handler
 * @access  Public (webhook)
 */
router.post(
  '/paymob',
  asyncHandler(async (req, res) => {
    const payload = req.body;
    const gateway = await prisma.paymentGateway.findFirst({
      where: { provider: 'PAYMOB', isEnabled: true }
    });

    if (!gateway) {
      return res.status(400).json({ error: 'Paymob gateway not configured' });
    }

    const isValid = paymentService.verifyPaymobWebhook(payload, gateway);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Paymob sends transaction data
    if (payload.obj && payload.obj.success && payload.obj.order) {
      const orderId = payload.obj.order.id.toString();
      const payment = await prisma.payment.findFirst({
        where: {
          transactionId: orderId,
          provider: 'PAYMOB'
        }
      });

      if (payment) {
        await paymentService.processSuccessfulPayment(payment.id, payload);
      }
    }

    res.json({ received: true });
  })
);

/**
 * @route   POST /api/payments/webhook/paytabs
 * @desc    Paytabs webhook handler
 * @access  Public (webhook)
 */
router.post(
  '/paytabs',
  asyncHandler(async (req, res) => {
    const payload = req.body;
    const signature = req.headers['signature'] || req.headers['x-paytabs-signature'];
    const gateway = await prisma.paymentGateway.findFirst({
      where: { provider: 'PAYTABS', isEnabled: true }
    });

    if (!gateway) {
      return res.status(400).json({ error: 'Paytabs gateway not configured' });
    }

    const isValid = paymentService.verifyPaytabsWebhook(payload, signature, gateway);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    if (payload.tran_ref) {
      const payment = await prisma.payment.findFirst({
        where: {
          transactionId: payload.tran_ref,
          provider: 'PAYTABS'
        }
      });

      if (payment && payload.payment_result?.response_status === 'A') {
        await paymentService.processSuccessfulPayment(payment.id, payload);
      }
    }

    res.json({ received: true });
  })
);

/**
 * @route   POST /api/payments/webhook/paypal
 * @desc    PayPal webhook handler
 * @access  Public (webhook)
 */
router.post(
  '/paypal',
  asyncHandler(async (req, res) => {
    const payload = req.body;
    const gateway = await prisma.paymentGateway.findFirst({
      where: { provider: 'PAYPAL', isEnabled: true }
    });

    if (!gateway) {
      return res.status(400).json({ error: 'PayPal gateway not configured' });
    }

    // Handle PayPal webhook events
    if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = payload.resource.supplementary_data?.related_ids?.order_id;
      
      if (orderId) {
        const payment = await prisma.payment.findFirst({
          where: {
            transactionId: orderId,
            provider: 'PAYPAL'
          }
        });

        if (payment) {
          await paymentService.processSuccessfulPayment(payment.id, payload);
        }
      }
    }

    res.json({ received: true });
  })
);

module.exports = router;

