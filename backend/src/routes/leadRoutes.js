const express = require('express');

const router = express.Router();

const leadController = require('../controllers/leadController');

const {
  authMiddleware,
  requireStaff
} = require('../middleware/authMiddleware');

/*
 * Public Lead Submission
 *
 * Visitors and prospective clients must be able to
 * submit a requirement without having an account.
 *
 * Anti-spam, validation, duplicate detection and
 * source/UTM capture should be handled by the
 * lead controller/service layer.
 */
router.post(
  '/',
  leadController.submitLead
);

/*
 * Admin / Scriza Staff Lead Management
 *
 * Authentication + staff-level RBAC is required
 * before accessing CRM lead data.
 */
router.get(
  '/',
  authMiddleware,
  requireStaff,
  leadController.getLeads
);

router.patch(
  '/:id',
  authMiddleware,
  requireStaff,
  leadController.updateLead
);

router.delete(
  '/:id',
  authMiddleware,
  requireStaff,
  leadController.deleteLead
);

module.exports = router;