const express = require('express');
const router = express.Router();

const controller = require('../controllers/caseStudyController');
const {
  authMiddleware,
  requireAdmin
} = require('../middleware/authMiddleware');

router.get('/', controller.getCaseStudies);
router.get('/:slug', controller.getCaseStudyBySlug);

router.post(
  '/',
  authMiddleware,
  requireAdmin,
  controller.createCaseStudy
);

router.get(
  '/admin/list/all',
  authMiddleware,
  requireAdmin,
  controller.getAdminCaseStudies
);

router.put(
  '/admin/:id',
  authMiddleware,
  requireAdmin,
  controller.updateCaseStudy
);

router.patch(
  '/admin/:id/review',
  authMiddleware,
  requireAdmin,
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