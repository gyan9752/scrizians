const express = require('express');
const router = express.Router();

const controller = require('../controllers/companyController');
const {
  authMiddleware,
  requireRole
} = require('../middleware/authMiddleware');

router.use(authMiddleware, requireRole('client'));

router.post('/', controller.createCompany);
router.get('/me', controller.getMyCompany);
router.put('/me', controller.updateMyCompany);

module.exports = router;