const express = require('express');

const router = express.Router();

const requirementController = require('../controllers/requirementController');

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
  requirementController.createRequirement
);

router.get(
  '/',
  requirementController.getMyRequirements
);

router.get(
  '/:id',
  requirementController.getRequirementById
);

router.put(
  '/:id',
  requirementController.updateRequirement
);

router.post(
  '/:id/submit',
  requirementController.submitRequirement
);

router.delete(
  '/:id',
  requirementController.deleteRequirement
);

module.exports = router;