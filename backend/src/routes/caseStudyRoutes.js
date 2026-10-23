const express = require('express');
const router = express.Router();

const controller = require('../controllers/caseStudyController');
const {
  authMiddleware,
  requireRole,
  requireAdmin
} = require('../middleware/authMiddleware');

router.get('/', controller.getCaseStudies);
router.get('/:slug', controller.getCaseStudyBySlug);

router.post(
  '/',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  controller.createCaseStudy
);

router.get(
  '/admin/list/all',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  controller.getAdminCaseStudies
);

router.put(
  '/admin/:id',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  controller.updateCaseStudy
);

router.patch(
  '/admin/:id/review',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  controller.reviewCaseStudy
);

router.patch(
  '/admin/:id/publish',
  authMiddleware,
  requireAdmin,
  controller.publishCaseStudy
);

router.delete(
  '/admin/:id',
  authMiddleware,
  requireAdmin,
  controller.deleteCaseStudy
);

module.exports = router;