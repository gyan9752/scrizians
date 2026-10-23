// // const express = require('express');
// // const router = express.Router();
// // const authController = require('../controllers/authController');

// // router.post('/register', authController.register);
// // router.post('/login', authController.login);

// // module.exports = router;



// const express = require('express');

// const router = express.Router();

// const authController = require('../controllers/authController');

// // Account registration
// router.post('/register', authController.register);

// // Password-based login
// router.post('/login', authController.login);

// // Refresh access token using refresh-token rotation
// router.post('/refresh', authController.refreshToken);

// // Logout current session
// router.post('/logout', authController.logout);

// // Logout all active sessions
// router.post('/logout-all', authController.logoutAll);

// module.exports = router;
const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Account registration
router.post('/register', authController.register);

// Password-based login
router.post('/login', authController.login);

// First-time 2FA enrollment (QR code + manual key)
router.post('/2fa/setup', authController.setupTwoFactor);

// Verify 2FA (authenticator app) code
router.post('/verify-2fa', authController.verify2FA);

// Refresh access token using refresh-token rotation
router.post('/refresh', authController.refreshToken);

// Logout current session
router.post('/logout', authController.logout);

// Logout all active sessions
// Authentication is required so users can only revoke their own sessions.
router.post('/logout-all', authMiddleware, authController.logoutAll);

// Current user profile
router.get('/me', authMiddleware, authController.getMe);
router.patch('/profile', authMiddleware, authController.updateProfile);

// Password Reset Flow
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

module.exports = router;