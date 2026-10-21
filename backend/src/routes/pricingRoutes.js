const express = require('express');
const router = express.Router();

const controller = require('../controllers/pricingController');
const {
  authMiddleware,
  requireAdmin
} = require('../middleware/authMiddleware');

router.get('/', controller.getPublicPricing);

router.get(
  '/admin',
  authMiddleware,
  requireAdmin,
  controller.getPricingAdmin
);

router.put(
  '/admin',
  authMiddleware,
  requireAdmin,
  controller.upsertPricing
);

router.put(
  '/admin/currency',
  authMiddleware,
  requireAdmin,
  controller.upsertCurrency
);

module.exports = router;