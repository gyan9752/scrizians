const express = require('express');
const router = express.Router();

const controller = require('../controllers/authorController');
const {
  authMiddleware,
  requireRole,
  requireAdmin
} = require('../middleware/authMiddleware');

router.get('/', controller.getPublicAuthors);

router.post(
  '/',
  authMiddleware,
  requireRole('contributor'),
  controller.createAuthor
);

router.get(
  '/me',
  authMiddleware,
  requireRole('contributor'),
  controller.getMyAuthor
);

router.put(
  '/me',
  authMiddleware,
  requireRole('contributor'),
  controller.updateMyAuthor
);

router.patch(
  '/admin/:id/approve',
  authMiddleware,
  requireAdmin,
  controller.approveAuthor
);

module.exports = router;