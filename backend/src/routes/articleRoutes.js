const express = require('express');
const router = express.Router();

const controller = require('../controllers/articleController');
const editorialController = require('../controllers/editorialController');

const {
  authMiddleware,
  requireRole,
  requireAdmin
} = require('../middleware/authMiddleware');

// Public
router.get('/', controller.getPublicArticles);
router.get('/:slug', controller.getArticleBySlug);

// Contributor & Admin Creation
router.post(
  '/',
  authMiddleware,
  requireRole('contributor', 'admin', 'scriza_staff'),
  controller.createArticle
);

router.get(
  '/mine/list',
  authMiddleware,
  requireRole('contributor'),
  controller.getMyArticles
);

router.put(
  '/mine/:id',
  authMiddleware,
  requireRole('contributor'),
  controller.updateMyArticle
);

router.post(
  '/mine/:id/submit',
  authMiddleware,
  requireRole('contributor'),
  controller.submitArticle
);

router.delete(
  '/mine/:id',
  authMiddleware,
  requireRole('contributor'),
  controller.deleteMyArticle
);


// Admin & Staff Editorial Workflow
router.get(
  '/admin/list/all',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  controller.getAdminArticles
);

router.post(
  '/admin/create',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  controller.createArticle
);

router.put(
  '/admin/:id',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  controller.adminUpdateArticle
);

router.delete(
  '/admin/:id',
  authMiddleware,
  requireAdmin,
  controller.adminDeleteArticle
);

router.patch(
  '/admin/:id/workflow',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  controller.moveArticleWorkflow
);

router.patch(
  '/admin/:id/schedule',
  authMiddleware,
  requireRole('admin', 'scriza_staff'),
  controller.scheduleArticle
);

router.patch(
  '/admin/:id/publish',
  authMiddleware,
  requireAdmin,
  controller.publishArticle
);

// Revisions
router.get(
  '/admin/:articleId/revisions',
  authMiddleware,
  requireAdmin,
  editorialController.getRevisions
);

// Editorial comments
router.get(
  '/admin/:articleId/comments',
  authMiddleware,
  requireAdmin,
  editorialController.getComments
);

router.post(
  '/admin/:articleId/comments',
  authMiddleware,
  requireAdmin,
  editorialController.addComment
);

router.patch(
  '/admin/:articleId/comments/:commentId/resolve',
  authMiddleware,
  requireAdmin,
  editorialController.resolveComment
);

module.exports = router;