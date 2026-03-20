const router = require('express').Router();
const walletService = require('../services/walletService');
const logger = require('../config/logger');

// POST /webhooks/stripe — Stripe payment events
router.post('/stripe', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'No signature' });
    }
    await walletService.handleStripeWebhook(req.body, signature);
    res.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
