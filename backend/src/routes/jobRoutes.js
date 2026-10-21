const express = require('express');

const router = express.Router();

const jobController = require('../controllers/jobController');
const {
  authMiddleware,
  requireRole
} = require('../middleware/authMiddleware');

router.get(
  '/',
  jobController.getJobs
);

// Candidate application list
router.get(
  '/applications/mine',
  authMiddleware,
  jobController.getMyApplications
);

router.get(
  '/:slug',
  jobController.getJobBySlug
);

// Job application
router.post(
  '/:slug/apply',
  authMiddleware,
  requireRole('candidate'),
  jobController.applyForJob
);

// Candidate withdraw application
router.patch(
  '/applications/:id/withdraw',
  authMiddleware,
  requireRole('candidate'),
  jobController.withdrawApplication
);

// Admin Application Pipeline Management
router.get(
  '/admin/applications/all',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  jobController.adminGetApplications
);

router.patch(
  '/admin/applications/:id/status',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  jobController.adminUpdateApplicationStatus
);

// Admin Management
router.post(
  '/',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  jobController.createJob
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  jobController.updateJob
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  jobController.deleteJob
);

module.exports = router;