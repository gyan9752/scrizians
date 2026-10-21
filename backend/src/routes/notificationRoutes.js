const express = require('express');
const router = express.Router();

const controller = require('../controllers/notificationController');

const {
  authMiddleware
} = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', controller.getMyNotifications);

router.patch(
  '/:id/read',
  controller.markAsRead
);

router.patch(
  '/read-all',
  controller.markAllAsRead
);

module.exports = router;