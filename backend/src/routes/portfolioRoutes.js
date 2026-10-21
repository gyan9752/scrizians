const express = require('express');
const router = express.Router();

const portfolioController = require('../controllers/portfolioController');
const {
  authMiddleware,
  requireRole,
  requireAdmin
} = require('../middleware/authMiddleware');

router.get('/', portfolioController.getPublicPortfolios);
router.get('/:slug', portfolioController.getPortfolioBySlug);

router.post(
  '/',
  authMiddleware,
  requireRole('scrizian', 'admin', 'scriza_staff'),
  portfolioController.createPortfolio
);

router.get(
  '/mine/list',
  authMiddleware,
  requireRole('scrizian', 'admin', 'scriza_staff'),
  portfolioController.getMyPortfolios
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('scrizian', 'admin', 'scriza_staff'),
  portfolioController.updatePortfolio
);

router.post(
  '/:id/submit',
  authMiddleware,
  requireRole('scrizian', 'admin', 'scriza_staff'),
  portfolioController.submitPortfolio
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('scrizian', 'admin', 'scriza_staff'),
  portfolioController.deletePortfolio
);

router.patch(
  '/:id/review',
  authMiddleware,
  requireAdmin,
  portfolioController.reviewPortfolio
);

module.exports = router;