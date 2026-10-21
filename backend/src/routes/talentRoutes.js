const express = require('express');

const router = express.Router();

const talentController = require('../controllers/talentController');
const {
  authMiddleware,
  requireRole
} = require('../middleware/authMiddleware');

/*
 * =========================================================
 * AUTHENTICATED TALENT ROUTES
 * =========================================================
 */

/*
 * GET /api/v1/talent/profile/me
 */
router.get(
  '/profile/me',
  authMiddleware,
  requireRole('scrizian'),
  talentController.getMyProfile
);

/*
 * POST /api/v1/talent/profile
 */
router.post(
  '/profile',
  authMiddleware,
  requireRole('scrizian'),
  talentController.createProfile
);

/*
 * PUT /api/v1/talent/profile
 */
router.put(
  '/profile',
  authMiddleware,
  requireRole('scrizian'),
  talentController.updateProfile
);

/*
 * POST /api/v1/talent/profile/submit-verification
 */
router.post(
  '/profile/submit-verification',
  authMiddleware,
  requireRole('scrizian'),
  talentController.submitForVerification
);

/*
 * =========================================================
 * ADMIN TALENT MANAGEMENT ROUTES
 * =========================================================
 */
router.post(
  '/',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  talentController.adminCreateTalent
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  talentController.adminUpdateTalent
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  talentController.adminDeleteTalent
);

/*
 * =========================================================
 * PUBLIC TALENT ROUTES
 * =========================================================
 */

/*
 * GET /api/v1/talent
 */
router.get(
  '/',
  talentController.getTalents
);

/*
 * GET /api/v1/talent/:scrizianId
 */
router.get(
  '/:scrizianId',
  talentController.getTalentByScrizianId
);

module.exports = router;