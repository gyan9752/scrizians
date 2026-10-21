const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return process.env.JWT_SECRET;
};

/*
 * Extract only a Bearer access token.
 */
const extractToken = (req) => {
  const authorization = req.headers.authorization;

  if (
    !authorization ||
    typeof authorization !== 'string'
  ) {
    return null;
  }

  const parts = authorization.trim().split(/\s+/);

  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;

  if (scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  if (!token) {
    return null;
  }

  return token;
};

/*
 * Authenticate the request using the short-lived
 * access JWT.
 *
 * The database is checked on every authenticated request
 * so that suspended/blocked/deleted users can be denied
 * immediately without waiting for JWT expiry.
 */
const authMiddleware = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        'Access denied. Authentication token is required.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret()
    );

    /*
     * Access tokens must contain a user ID and role.
     */
    if (
      !decoded ||
      !decoded.id ||
      !decoded.role
    ) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid authentication token.'
      });
    }

    /*
     * Refresh tokens contain sessionId and are signed
     * with a separate secret. They must never be accepted
     * as access tokens.
     */
    if (decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid access token.'
      });
    }

    /*
     * Reject tokens that are explicitly marked as another
     * token type in case future auth flows add token types.
     */
    if (
      decoded.tokenType &&
      decoded.tokenType !== 'access'
    ) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid access token.'
      });
    }

    /*
     * Always load the current role from MongoDB instead
     * of trusting the role stored inside the JWT.
     *
     * This ensures an admin can change a user's role and
     * the change takes effect immediately.
     */
    const user = await User.findById(
      decoded.id
    ).select(
      'name email phone role scrizianId isVerified emailVerified phoneVerified accountStatus'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'User account not found.'
      });
    }

    /*
     * Deleted and blocked accounts cannot access
     * authenticated resources.
     */
    if (
      user.accountStatus === 'blocked' ||
      user.accountStatus === 'deleted'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'This account is no longer available.'
      });
    }

    /*
     * Suspended accounts are also denied.
     */
    if (
      user.accountStatus === 'suspended'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'This account has been suspended.'
      });
    }

    /*
     * Attach a sanitized user object for existing
     * controllers and RBAC middleware.
     */
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      role: user.role,
      scrizianId:
        user.scrizianId || null,
      isVerified: user.isVerified,
      emailVerified:
        user.emailVerified,
      phoneVerified:
        user.phoneVerified,
      accountStatus:
        user.accountStatus
    };

    /*
     * Keep authentication-specific information separate
     * from req.user.
     */
    req.auth = {
      userId: user._id.toString(),
      role: user.role,
      token: decoded
    };

    return next();
  } catch (error) {
    if (
      error.name ===
      'TokenExpiredError'
    ) {
      return res.status(401).json({
        success: false,
        message:
          'Access token has expired.'
      });
    }

    if (
      error.name ===
        'JsonWebTokenError' ||
      error.name ===
        'NotBeforeError'
    ) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid authentication token.'
      });
    }

    console.error(
      'Authentication middleware error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to authenticate the request.'
    });
  }
};

/*
 * Role-based access control.
 *
 * Example:
 *
 * router.get(
 *   '/admin',
 *   authMiddleware,
 *   requireRole('admin'),
 *   controller
 * );
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication is required.'
      });
    }

    if (!roles.length) {
      return res.status(403).json({
        success: false,
        message:
          'No roles have been configured for this resource.'
      });
    }

    if (
      !roles.includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Forbidden. Insufficient role permissions.'
      });
    }

    return next();
  };
};

/*
 * Admin-only access.
 */
const requireAdmin =
  requireRole('admin');

/*
 * Admin + Scriza Staff access.
 */
const requireStaff =
  requireRole(
    'admin',
    'scriza_staff'
  );

module.exports = {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireStaff
};