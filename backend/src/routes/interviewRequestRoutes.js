const express = require('express');

const router = express.Router();

const interviewController =
  require('../controllers/interviewRequestController');

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
  interviewController.createInterviewRequest
);

router.get(
  '/',
  interviewController.getMyInterviewRequests
);

router.patch(
  '/:id/status',
  interviewController.updateInterviewStatus
);

router.delete(
  '/:id',
  interviewController.deleteInterviewRequest
);

module.exports = router;
