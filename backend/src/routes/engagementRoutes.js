const express = require('express');
const router = express.Router();

const controller = require('../controllers/engagementController');
const {
  authMiddleware,
  requireRole
} = require('../middleware/authMiddleware');

router.use(authMiddleware, requireRole('client'));

router.post('/', controller.createEngagement);
router.get('/', controller.getMyEngagements);
router.get('/:id', controller.getEngagementById);
router.patch('/:id/status', controller.updateEngagementStatus);
router.delete('/:id', controller.deleteEngagement);

module.exports = router;
