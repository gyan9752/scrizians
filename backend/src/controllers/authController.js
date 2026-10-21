const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const {
  generateSecret,
  verifyToken,
  buildOtpAuthUrl
} = require('../utils/totp');
const {
  encryptSecret,
  decryptSecret
} = require('../utils/secretCrypto');

const ACCESS_TOKEN_EXPIRES_IN =
  process.env.JWT_ACCESS_EXPIRES_IN || '15m';

const REFRESH_TOKEN_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const MAX_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_MINUTES = 15;
const MAX_LOGIN_HISTORY = 50;
const MAX_SESSIONS = 10;

const TWO_FACTOR_CHALLENGE_EXPIRES_IN = '5m';
/*
 * 2FA mode:
 *   static - fixed OTP from TWO_FACTOR_STATIC_OTP (no SMTP / app needed)
 *   totp   - authenticator app (QR code enrollment)
 */
const getTwoFactorMode = () =>
  (process.env.TWO_FACTOR_MODE || 'static').toLowerCase() === 'totp'
    ? 'totp'
    : 'static';

const getStaticOtp = () => {
  const otp = String(process.env.TWO_FACTOR_STATIC_OTP || '').trim();

  return /^\d{6}$/.test(otp) ? otp : null;
};

const TWO_FACTOR_ISSUER =
  process.env.TWO_FACTOR_ISSUER || 'Scrizians';

/*
 * If a refresh token was rotated less than this long ago, a request
 * that still carries the old token is accepted (multi-tab / parallel
 * request race) instead of revoking the whole session.
 */
const REFRESH_REUSE_GRACE_MS = 30 * 1000;

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return process.env.JWT_SECRET;
};

const getRefreshJwtSecret = () => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT_REFRESH_SECRET is not configured.'
    );
  }

  return process.env.JWT_REFRESH_SECRET;
};

const getRequestIp = (req) => {
  return (
    req.ip ||
    req.headers['x-forwarded-for']
      ?.split(',')[0]
      ?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
};

const getUserAgent = (req) => {
  return req.headers['user-agent'] || null;
};

const getDeviceId = (req) => {
  return req.headers['x-device-id'] || null;
};

const getDeviceName = (req) => {
  return req.headers['x-device-name'] || null;
};

const hashToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

const generateSessionId = () => {
  return crypto.randomUUID();
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      scrizianId: user.scrizianId || null,
      tokenType: 'access'
    },
    getJwtSecret(),
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN
    }
  );
};

const generateRefreshToken = (
  user,
  sessionId
) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      sessionId,
      jti: crypto.randomUUID()
    },
    getRefreshJwtSecret(),
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN
    }
  );
};

const parseDurationToMilliseconds = (
  value,
  fallback
) => {
  if (
    !value ||
    typeof value !== 'string'
  ) {
    return fallback;
  }

  const match = value
    .trim()
    .match(/^(\d+)(s|m|h|d)$/i);

  if (!match) {
    return fallback;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return amount * multipliers[unit];
};

const getRefreshTokenExpiry = () => {
  const fallback =
    30 *
    24 *
    60 *
    60 *
    1000;

  return new Date(
    Date.now() +
      parseDurationToMilliseconds(
        REFRESH_TOKEN_EXPIRES_IN,
        fallback
      )
  );
};

const getRefreshCookieOptions = () => {
  const isProduction =
    process.env.NODE_ENV ===
    'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction
      ? 'strict'
      : 'lax',
    maxAge:
      parseDurationToMilliseconds(
        REFRESH_TOKEN_EXPIRES_IN,
        30 *
          24 *
          60 *
          60 *
          1000
      ),
    path: '/api/v1/auth'
  };
};

const setRefreshCookie = (
  res,
  refreshToken
) => {
  res.cookie(
    'scrizians_refresh_token',
    refreshToken,
    getRefreshCookieOptions()
  );
};

const clearRefreshCookie = (res) => {
  const options =
    getRefreshCookieOptions();

  delete options.maxAge;

  res.clearCookie(
    'scrizians_refresh_token',
    options
  );
};

const buildAuthResponse = (
  user,
  accessToken
) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    role: user.role,
    avatar: user.avatar || null,
    title: user.title || null,
    scrizianId:
      user.scrizianId || null,
    isVerified:
      user.isVerified,
    emailVerified:
      user.emailVerified,
    phoneVerified:
      user.phoneVerified,
    accountStatus:
      user.accountStatus,

    /*
     * Kept for backward compatibility
     * with the existing frontend.
     */
    accessToken,
    token: accessToken
  };
};

const createSession = async (
  user,
  req
) => {
  const sessionId =
    generateSessionId();

  const refreshToken =
    generateRefreshToken(
      user,
      sessionId
    );

  const session = {
    sessionId,
    refreshTokenHash:
      hashToken(refreshToken),
    deviceId:
      getDeviceId(req),
    deviceName:
      getDeviceName(req),
    ipAddress:
      getRequestIp(req),
    userAgent:
      getUserAgent(req),
    createdAt: new Date(),
    lastUsedAt: new Date(),
    expiresAt:
      getRefreshTokenExpiry(),
    revokedAt: null
  };

  user.sessions =
    user.sessions || [];

  /*
   * Remove expired and revoked sessions.
   */
  user.sessions =
    user.sessions.filter(
      (item) => {
        const active =
          !item.revokedAt &&
          item.expiresAt &&
          new Date(
            item.expiresAt
          ).getTime() >
            Date.now();

        return active;
      }
    );

  /*
   * Keep only the configured
   * number of active sessions.
   */
  if (
    user.sessions.length >=
    MAX_SESSIONS
  ) {
    user.sessions.sort(
      (a, b) =>
        new Date(
          a.lastUsedAt
        ).getTime() -
        new Date(
          b.lastUsedAt
        ).getTime()
    );

    user.sessions.shift();
  }

  user.sessions.push(
    session
  );

  return {
    sessionId,
    refreshToken
  };
};

const recordLogin = async (
  user,
  req,
  success,
  failureReason = null
) => {
  user.loginHistory =
    user.loginHistory || [];

  user.loginHistory.push({
    loginAt: new Date(),
    ipAddress:
      getRequestIp(req),
    userAgent:
      getUserAgent(req),
    deviceId:
      getDeviceId(req),
    success,
    failureReason
  });

  if (
    user.loginHistory.length >
    MAX_LOGIN_HISTORY
  ) {
    user.loginHistory =
      user.loginHistory.slice(
        -MAX_LOGIN_HISTORY
      );
  }
};

const handleFailedLogin = async (
  user,
  req,
  reason
) => {
  user.failedLoginAttempts =
    (user.failedLoginAttempts ||
      0) + 1;

  await recordLogin(
    user,
    req,
    false,
    reason
  );

  if (
    user.failedLoginAttempts >=
    MAX_LOGIN_ATTEMPTS
  ) {
    user.lockedUntil =
      new Date(
        Date.now() +
          ACCOUNT_LOCK_MINUTES *
            60 *
            1000
      );
  }

  await user.save();
};

const isAccountLocked = (
  user
) => {
  if (!user.lockedUntil) {
    return false;
  }

  if (
    new Date(
      user.lockedUntil
    ).getTime() <= Date.now()
  ) {
    return false;
  }

  return true;
};

const normalizeEmail = (
  email
) => {
  if (
    !email ||
    typeof email !== 'string'
  ) {
    return null;
  }

  return email
    .trim()
    .toLowerCase();
};

const normalizePhone = (
  phone
) => {
  if (
    !phone ||
    typeof phone !== 'string'
  ) {
    return null;
  }

  return phone.trim();
};

const generateScrizianId =
  async () => {
    let scrizianId;
    let exists = true;

    while (exists) {
      const number =
        Math.floor(
          10000 +
            Math.random() *
              90000
        );

      scrizianId =
        `SZN-DEV-${number}`;

      exists =
        await User.exists({
          scrizianId
        });
    }

    return scrizianId;
  };

/*
 * =========================================================
 * TWO-FACTOR HELPERS
 * =========================================================
 */

const requiresTwoFactor = (user) =>
  user.role === 'admin' ||
  user.role === 'scriza_staff' ||
  Boolean(user.twoFactor && user.twoFactor.enabled);

/*
 * Short-lived token proving that the password step succeeded.
 * It is NOT an access token (no role, tokenType differs) so it can
 * never be used to call protected APIs.
 */
const issueTwoFactorChallenge = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      tokenType: '2fa_challenge'
    },
    getJwtSecret(),
    { expiresIn: TWO_FACTOR_CHALLENGE_EXPIRES_IN }
  );

const readTwoFactorChallenge = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (decoded.tokenType !== '2fa_challenge' || !decoded.id) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
};

const formatManualKey = (secret) =>
  secret.match(/.{1,4}/g).join(' ');

/*
 * REGISTER
 */
exports.register = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      avatar,
      title
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    const normalizedPhone =
      normalizePhone(phone);

    if (
      !name ||
      (!normalizedEmail &&
        !normalizedPhone) ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Name, password and either email or phone number are required.'
      });
    }

    if (
      typeof password !==
        'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters long.'
      });
    }

    /*
     * Public registration can only create
     * non-privileged accounts.
     */
    const requestedRole =
      role || 'scrizian';

    const allowedRegistrationRoles =
      [
        'scrizian',
        'client',
        'contributor',
        'candidate'
      ];

    if (
      !allowedRegistrationRoles.includes(
        requestedRole
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          'This role cannot be created through public registration.'
      });
    }

    const duplicateConditions = [];

if (normalizedEmail) {
  duplicateConditions.push({
    email: normalizedEmail
  });
}

if (normalizedPhone) {
  duplicateConditions.push({
    phone: normalizedPhone
  });
}

const existingUser =
  duplicateConditions.length > 0
    ? await User.findOne({
        $or: duplicateConditions
      })
    : null;
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          'An account with these contact details already exists.'
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    const scrizianId =
      requestedRole ===
      'scrizian'
        ? await generateScrizianId()
        : undefined;

    const user =
      await User.create({
        name: name.trim(),
        email:
          normalizedEmail ||
          undefined,
        phone:
          normalizedPhone ||
          undefined,
        password:
          hashedPassword,
        role: requestedRole,
        avatar: avatar || undefined,
        title: title || undefined,
        scrizianId,
        isVerified: false,
        emailVerified: false,
        phoneVerified: false,
        accountStatus: 'active',
        passwordChangedAt:
          new Date()
      });

    const accessToken =
      generateAccessToken(user);

    const {
      refreshToken
    } =
      await createSession(
        user,
        req
      );

    await recordLogin(
      user,
      req,
      true
    );

    user.lastLoginAt =
      new Date();

    user.lastLoginIp =
      getRequestIp(req);

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;

    await user.save();

    setRefreshCookie(
      res,
      refreshToken
    );

    return res.status(201).json({
      success: true,
      message:
        'Account created successfully. Contact verification is required.',
      ...buildAuthResponse(
        user,
        accessToken
      )
    });
  } catch (error) {
    console.error(
      'Registration error:',
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          'An account with these details already exists.'
      });
    }

    return res.status(500).json({
      success: false,
      message:
        'Unable to create the account.'
    });
  }
};

/*
 * LOGIN
 */
exports.login = async (
  req,
  res
) => {
  try {
    const email =
      normalizeEmail(
        req.body.email
      );

    const phone =
      normalizePhone(
        req.body.phone
      );

    const password =
      req.body.password;

    if (
      (!email && !phone) ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Email or phone number and password are required.'
      });
    }

    const identifier = email
      ? { email }
      : { phone };

    /*
     * Password, lock information and
     * 2FA configuration are select:false
     * in User.js, so they must be
     * explicitly selected.
     */
    const user =
      await User.findOne(
        identifier
      ).select(
        '+password ' +
          '+failedLoginAttempts ' +
          '+lockedUntil ' +
          '+twoFactor.enabled ' +
          '+twoFactor.method ' +
          '+twoFactor.secret ' +
          '+twoFactor.verifiedAt'
      );

    /*
     * Do not reveal whether an account exists.
     */
    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid credentials.'
      });
    }

    if (
      user.accountStatus ===
        'blocked' ||
      user.accountStatus ===
        'deleted'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'This account is not available.'
      });
    }

    if (
      user.accountStatus ===
      'suspended'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'This account has been suspended.'
      });
    }

    if (
      isAccountLocked(user)
    ) {
      return res.status(429).json({
        success: false,
        message:
          'Too many failed login attempts. Please try again later.'
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          'Password login is not configured for this account.'
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      await handleFailedLogin(
        user,
        req,
        'Invalid password'
      );

      return res.status(401).json({
        success: false,
        message:
          'Invalid credentials.'
      });
    }

    /*
     * Admins/staff (and anyone who enabled it) must pass 2FA.
     * No tokens are issued here - only a short-lived challenge
     * token that the 2FA step must present together with the code.
     */
    if (requiresTwoFactor(user)) {
      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        twoFactorMode: getTwoFactorMode(),
        twoFactorSetupRequired:
          getTwoFactorMode() === 'totp' &&
          !(user.twoFactor && user.twoFactor.enabled),
        challengeToken: issueTwoFactorChallenge(user),
        email: user.email,
        message:
          'Two-factor verification required. Enter the 6-digit code from your authenticator app.'
      });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt =
      new Date();

    user.lastLoginIp =
      getRequestIp(req);

    const accessToken =
      generateAccessToken(user);

    const {
      refreshToken
    } =
      await createSession(
        user,
        req
      );

    await recordLogin(
      user,
      req,
      true
    );

    await user.save();

    setRefreshCookie(
      res,
      refreshToken
    );

    return res.status(200).json({
      success: true,
      ...buildAuthResponse(
        user,
        accessToken
      )
    });
  } catch (error) {
    console.error(
      'Login error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to process login.'
    });
  }
};

/*
 * REFRESH TOKEN
 *
 * Refresh-token rotation with an atomic compare-and-swap, plus a
 * short grace window so that several tabs / parallel requests that
 * refresh at the same moment do not kill the session.
 */
exports.refreshToken = async (
  req,
  res
) => {
  try {
    const refreshToken =
      req.cookies
        ?.scrizians_refresh_token ||
      req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message:
          'Refresh token is required.'
      });
    }

    let decoded;

    try {
      decoded =
        jwt.verify(
          refreshToken,
          getRefreshJwtSecret()
        );
    } catch (error) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message:
          'Invalid or expired refresh token.'
      });
    }

    if (
      !decoded.sessionId ||
      !decoded.id
    ) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message:
          'Invalid refresh token.'
      });
    }

    /*
     * Hashes are select:false in User.js, so select them explicitly.
     */
    const user =
      await User.findById(
        decoded.id
      ).select(
        '+sessions.refreshTokenHash +sessions.prevRefreshTokenHash'
      );

    if (!user) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message:
          'Invalid refresh token.'
      });
    }

    if (
      user.accountStatus !==
      'active'
    ) {
      clearRefreshCookie(res);

      return res.status(403).json({
        success: false,
        message:
          'This account is not active.'
      });
    }

    const session =
      user.sessions?.find(
        (item) =>
          item.sessionId ===
          decoded.sessionId
      );

    if (!session) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message:
          'Session not found.'
      });
    }

    if (session.revokedAt) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message:
          'Session has been revoked.'
      });
    }

    if (
      !session.expiresAt ||
      new Date(
        session.expiresAt
      ).getTime() <=
        Date.now()
    ) {
      await User.updateOne(
        {
          _id: user._id,
          'sessions.sessionId': session.sessionId
        },
        {
          $set: {
            'sessions.$.revokedAt': new Date()
          }
        }
      );

      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message:
          'Session has expired.'
      });
    }

    const tokenHash =
      hashToken(refreshToken);

    const isCurrentToken =
      Boolean(session.refreshTokenHash) &&
      tokenHash === session.refreshTokenHash;

    const isRecentlyRotatedToken =
      !isCurrentToken &&
      Boolean(session.prevRefreshTokenHash) &&
      tokenHash === session.prevRefreshTokenHash &&
      Boolean(session.rotatedAt) &&
      Date.now() -
        new Date(session.rotatedAt).getTime() <
        REFRESH_REUSE_GRACE_MS;

    /*
     * Unknown / old token outside the grace window = reuse.
     */
    if (
      !isCurrentToken &&
      !isRecentlyRotatedToken
    ) {
      await User.updateOne(
        {
          _id: user._id,
          'sessions.sessionId': session.sessionId
        },
        {
          $set: {
            'sessions.$.revokedAt': new Date()
          }
        }
      );

      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message:
          'Invalid refresh token.'
      });
    }

    const newAccessToken =
      generateAccessToken(user);

    /*
     * Another tab/request has just rotated the token. The browser
     * already holds (or is about to receive) the newer cookie, so
     * only hand out a fresh access token here.
     */
    if (isRecentlyRotatedToken) {
      return res.status(200).json({
        success: true,
        accessToken:
          newAccessToken,
        token:
          newAccessToken
      });
    }

    const newRefreshToken =
      generateRefreshToken(
        user,
        session.sessionId
      );

    const now = new Date();

    /*
     * Atomic compare-and-swap: only succeeds if nobody rotated the
     * token between our read and this write.
     */
    const rotation =
      await User.updateOne(
        {
          _id: user._id,
          sessions: {
            $elemMatch: {
              sessionId: session.sessionId,
              refreshTokenHash: tokenHash,
              revokedAt: null
            }
          }
        },
        {
          $set: {
            'sessions.$.refreshTokenHash':
              hashToken(newRefreshToken),
            'sessions.$.prevRefreshTokenHash':
              tokenHash,
            'sessions.$.rotatedAt': now,
            'sessions.$.lastUsedAt': now,
            'sessions.$.expiresAt':
              getRefreshTokenExpiry()
          }
        }
      );

    if (rotation.modifiedCount === 0) {
      /*
       * Lost the race to a concurrent refresh - same situation as
       * the grace-window case above.
       */
      return res.status(200).json({
        success: true,
        accessToken:
          newAccessToken,
        token:
          newAccessToken
      });
    }

    setRefreshCookie(
      res,
      newRefreshToken
    );

    return res.status(200).json({
      success: true,
      accessToken:
        newAccessToken,
      token:
        newAccessToken
    });
  } catch (error) {
    console.error(
      'Refresh token error:',
      error
    );

    clearRefreshCookie(res);

    return res.status(500).json({
      success: false,
      message:
        'Unable to refresh the session.'
    });
  }
};

/*
 * LOGOUT CURRENT SESSION
 */
exports.logout = async (
  req,
  res
) => {
  try {
    const refreshToken =
      req.cookies
        ?.scrizians_refresh_token ||
      req.body?.refreshToken;

    if (refreshToken) {
      try {
        const decoded =
          jwt.verify(
            refreshToken,
            getRefreshJwtSecret()
          );

        if (
          decoded.id &&
          decoded.sessionId
        ) {
          const user =
            await User.findById(
              decoded.id
            );

          if (user) {
            const session =
              user.sessions?.find(
                (item) =>
                  item.sessionId ===
                  decoded.sessionId
              );

            if (session) {
              session.revokedAt =
                new Date();

              await user.save();
            }
          }
        }
      } catch (error) {
        /*
         * Logout remains idempotent even
         * if the token is expired/invalid.
         */
      }
    }

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message:
        'Logged out successfully.'
    });
  } catch (error) {
    console.error(
      'Logout error:',
      error
    );

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message:
        'Logged out successfully.'
    });
  }
};

/*
 * LOGOUT ALL SESSIONS
 *
 * This route is protected by authMiddleware.
 * Never trust userId from req.body.
 */
exports.logoutAll = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?.id ||
      req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication is required.'
      });
    }

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'User not found.'
      });
    }

    if (user.sessions?.length) {
      user.sessions.forEach(
        (session) => {
          if (!session.revokedAt) {
            session.revokedAt =
              new Date();
          }
        }
      );

      await user.save();
    }

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message:
        'All sessions have been logged out.'
    });
  } catch (error) {
    console.error(
      'Logout all error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to log out all sessions.'
    });
  }
};

/*
 * 2FA SETUP (first-time enrollment)
 *
 * Requires the challenge token issued after a correct password.
 * Returns a QR code + manual key for an authenticator app. The
 * secret stays "pending" until the first valid code is submitted
 * to /verify-2fa. Calling this again before that returns the same
 * pending secret, so the QR code on screen never goes stale.
 */
exports.setupTwoFactor = async (req, res) => {
  try {
    if (getTwoFactorMode() !== 'totp') {
      return res.status(400).json({
        success: false,
        message: 'Authenticator setup is not required in static OTP mode.'
      });
    }

    const challenge = readTwoFactorChallenge(
      req.body?.challengeToken
    );

    if (!challenge) {
      return res.status(401).json({
        success: false,
        message:
          'Your sign-in session expired. Please log in again.'
      });
    }

    const user = await User.findById(challenge.id).select(
      '+twoFactor.secret'
    );

    if (!user || user.accountStatus !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Unable to set up two-factor authentication.'
      });
    }

    if (!requiresTwoFactor(user)) {
      return res.status(403).json({
        success: false,
        message:
          'Two-factor authentication is not available for this account.'
      });
    }

    if (user.twoFactor && user.twoFactor.enabled) {
      return res.status(409).json({
        success: false,
        message:
          'Two-factor authentication is already set up for this account.'
      });
    }

    let secret;

    if (user.twoFactor && user.twoFactor.secret) {
      secret = decryptSecret(user.twoFactor.secret);
    } else {
      secret = generateSecret();

      user.set('twoFactor.secret', encryptSecret(secret));
      user.set('twoFactor.method', 'totp');
      user.set('twoFactor.enabled', false);

      await user.save();
    }

    const account = user.email || user.phone || String(user._id);

    const otpauthUrl = buildOtpAuthUrl({
      secret,
      account,
      issuer: TWO_FACTOR_ISSUER
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      margin: 1,
      width: 220
    });

    return res.status(200).json({
      success: true,
      issuer: TWO_FACTOR_ISSUER,
      account,
      manualKey: formatManualKey(secret),
      qrCodeDataUrl
    });
  } catch (error) {
    console.error('2FA setup error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to start two-factor setup.'
    });
  }
};

/*
 * VERIFY 2FA (TOTP code)
 *
 * Needs the challenge token from /login (never trusts email or
 * password sent again) and a real 6-digit code. Wrong codes count
 * towards the same lockout as wrong passwords.
 */
exports.verify2FA = async (req, res) => {
  try {
    const challenge = readTwoFactorChallenge(
      req.body?.challengeToken
    );

    if (!challenge) {
      return res.status(401).json({
        success: false,
        message:
          'Your sign-in session expired. Please log in again.'
      });
    }

    const twoFactorCode = String(
      req.body.twoFactorCode ||
        req.body.otp ||
        req.body.otpCode ||
        ''
    ).replace(/\s/g, '');

    if (!/^\d{6}$/.test(twoFactorCode)) {
      return res.status(400).json({
        success: false,
        message:
          'Enter the 6-digit code from your authenticator app.'
      });
    }

    const user = await User.findById(challenge.id).select(
      '+failedLoginAttempts +lockedUntil +twoFactor.secret +twoFactor.lastUsedStep'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'This account is not available.'
      });
    }

    if (isAccountLocked(user)) {
      return res.status(429).json({
        success: false,
        message:
          'Too many failed attempts. Please try again later.'
      });
    }

    /*
     * STATIC OTP MODE (temporary, until SMTP / authenticator is used)
     */
    if (getTwoFactorMode() === 'static') {
      const expected = getStaticOtp();

      if (!expected) {
        console.error(
          'TWO_FACTOR_STATIC_OTP must be a 6-digit number when TWO_FACTOR_MODE=static.'
        );

        return res.status(500).json({
          success: false,
          message:
            'Static OTP is not configured on the server (TWO_FACTOR_STATIC_OTP).'
        });
      }

      const given = Buffer.from(twoFactorCode);
      const wanted = Buffer.from(expected);
      const matches =
        given.length === wanted.length &&
        crypto.timingSafeEqual(given, wanted);

      if (!matches) {
        await handleFailedLogin(user, req, 'Invalid static OTP');

        return res.status(401).json({
          success: false,
          message: 'Invalid OTP. Please try again.'
        });
      }

      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      user.lastLoginAt = new Date();
      user.lastLoginIp = getRequestIp(req);

      const staticAccessToken = generateAccessToken(user);
      const staticSession = await createSession(user, req);

      await recordLogin(user, req, true);
      await user.save();

      setRefreshCookie(res, staticSession.refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Two-factor verification successful.',
        ...buildAuthResponse(user, staticAccessToken)
      });
    }

    if (!user.twoFactor || !user.twoFactor.secret) {
      return res.status(400).json({
        success: false,
        message:
          'Two-factor setup is not complete. Please log in again to set it up.'
      });
    }

    let secret;

    try {
      secret = decryptSecret(user.twoFactor.secret);
    } catch (error) {
      console.error('2FA secret decrypt error:', error.message);

      return res.status(500).json({
        success: false,
        message:
          'Two-factor configuration is invalid. Ask a developer to run "npm run reset-2fa" for this account.'
      });
    }

    const matchedStep = verifyToken(secret, twoFactorCode, {
      lastUsedStep: user.twoFactor.lastUsedStep || 0
    });

    if (matchedStep === null) {
      await handleFailedLogin(user, req, 'Invalid 2FA code');

      return res.status(401).json({
        success: false,
        message:
          'Invalid or expired code. Check your authenticator app and try again.'
      });
    }

    /*
     * First valid code = enrollment is confirmed.
     */
    if (!user.twoFactor.enabled) {
      user.set('twoFactor.enabled', true);
      user.set('twoFactor.method', 'totp');
      user.set('twoFactor.verifiedAt', new Date());
    }

    user.set('twoFactor.lastUsedStep', matchedStep);

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    user.lastLoginIp = getRequestIp(req);

    const accessToken = generateAccessToken(user);
    const { refreshToken } = await createSession(user, req);

    await recordLogin(user, req, true);
    await user.save();

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Two-factor verification successful.',
      ...buildAuthResponse(user, accessToken)
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);

    return res.status(500).json({
      success: false,
      message: 'Two-factor verification failed.'
    });
  }
};

/*
 * GET ME (Current User Profile)
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const token = req.headers.authorization?.split(' ')[1] || '';
    return res.status(200).json({
      success: true,
      data: buildAuthResponse(user, token)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/*
 * UPDATE PROFILE (Avatar, Name, Phone, Title)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, title, avatar } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (title !== undefined) user.title = title;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();
    const token = req.headers.authorization?.split(' ')[1] || '';
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: buildAuthResponse(user, token)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
