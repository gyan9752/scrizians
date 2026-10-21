const express = require('express');

const router = express.Router();

const shortlistController =
  require('../controllers/shortlistController');

const {
  authMiddleware,
  requireRole
} = require('../middleware/authMiddleware');

router.use(
  authMiddleware,
  requireRole('client')
);

router.post(
  '/',
  shortlistController.createShortlist
);

router.get(
  '/',
  shortlistController.getMyShortlists
);

router.get(
  '/requirement/:requirementId',
  shortlistController.getRequirementShortlists
);

router.patch(
  '/:id/status',
  shortlistController.updateShortlistStatus
);

router.delete(
  '/:id',
  shortlistController.removeShortlist
);

module.exports = router;