const express = require('express');

const router = express.Router();

const adminController = require('../controllers/adminController');

const {
  authMiddleware,
  requireRole
} = require('../middleware/authMiddleware');

router.get(
  '/stats',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  adminController.getAdminDashboardStats
);

router.patch(
  '/talent/:scrizianId/approve',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  adminController.approveTalent
);

// Development-only staff creation
router.post(
  '/dev/create-staff',
  adminController.createDevStaff
);

router.get(
  '/requirements',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  adminController.getRequirements
);

router.patch(
  '/requirements/:id/review',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  adminController.reviewRequirement
);

router.delete(
  '/requirements/:id',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  adminController.deleteRequirement
);


// Granular User Role Management (RBAC)
router.get(
  '/users',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  adminController.getUsers
);

router.post(
  '/users',
  authMiddleware,
  requireRole('admin'),
  adminController.createUser
);

router.patch(
  '/users/:id',
  authMiddleware,
  requireRole('admin'),
  adminController.updateUser
);

router.put(
  '/users/:id',
  authMiddleware,
  requireRole('admin'),
  adminController.updateUser
);

router.delete(
  '/users/:id',
  authMiddleware,
  requireRole('admin'),
  adminController.deleteUser
);

module.exports = router;