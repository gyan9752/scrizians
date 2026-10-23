const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      trim: true
    },

    refreshTokenHash: {
      type: String,
      required: true,
      select: false
    },

    /*
     * Hash of the previous refresh token + when it was rotated.
     * Lets two tabs/requests that refresh at the same moment both
     * succeed instead of being treated as token theft.
     */
    prevRefreshTokenHash: {
      type: String,
      default: null,
      select: false
    },

    rotatedAt: {
      type: Date,
      default: null
    },

    deviceId: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200
    },

    deviceName: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200
    },

    ipAddress: {
      type: String,
      default: null,
      maxlength: 100
    },

    userAgent: {
      type: String,
      default: null,
      maxlength: 1000
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    lastUsedAt: {
      type: Date,
      default: Date.now
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    revokedAt: {
      type: Date,
      default: null
    }
  },
  {
    _id: false
  }
);

const loginHistorySchema = new mongoose.Schema(
  {
    loginAt: {
      type: Date,
      default: Date.now
    },

    ipAddress: {
      type: String,
      default: null,
      maxlength: 100
    },

    userAgent: {
      type: String,
      default: null,
      maxlength: 1000
    },

    deviceId: {
      type: String,
      default: null,
      maxlength: 200
    },

    success: {
      type: Boolean,
      default: true
    },

    failureReason: {
      type: String,
      default: null,
      maxlength: 500
    }
  },
  {
    _id: false
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },

    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address.'
      ]
    },

    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: 20
    },

    password: {
      type: String,
      required: false,
      select: false
    },

    role: {
      type: String,
      enum: [
        'scrizian',
        'client',
        'contributor',
        'candidate',
        'scriza_staff',
        'admin'
      ],
      default: 'scrizian',
      required: true,
      index: true
    },

    scrizianId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true
    },

    avatar: {
      type: String,
      default: null
    },

    title: {
      type: String,
      default: null,
      trim: true
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },

    emailVerified: {
      type: Boolean,
      default: false
    },

    phoneVerified: {
      type: Boolean,
      default: false
    },

    verification: {
      otpHash: {
        type: String,
        default: null,
        select: false
      },

      otpExpiresAt: {
        type: Date,
        default: null,
        select: false
      },

      otpAttempts: {
        type: Number,
        default: 0,
        select: false
      },

      lastOtpSentAt: {
        type: Date,
        default: null,
        select: false
      }
    },

    twoFactor: {
      enabled: {
        type: Boolean,
        default: false
      },

      method: {
        type: String,
        enum: ['otp', 'totp', null],
        default: null
      },

      secret: {
        type: String,
        default: null,
        select: false
      },

      verifiedAt: {
        type: Date,
        default: null
      },

      /*
       * Last accepted TOTP time-step (prevents code replay).
       */
      lastUsedStep: {
        type: Number,
        default: 0,
        select: false
      }
    },

    sessions: {
      type: [sessionSchema],
      default: []
    },

    loginHistory: {
      type: [loginHistorySchema],
      default: []
    },

    accountStatus: {
      type: String,
      enum: [
        'active',
        'pending',
        'suspended',
        'blocked',
        'deleted'
      ],
      default: 'active',
      index: true
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false
    },

    lockedUntil: {
      type: Date,
      default: null,
      select: false
    },

    lastLoginAt: {
      type: Date,
      default: null
    },

    lastLoginIp: {
      type: String,
      default: null,
      maxlength: 100
    },

    passwordChangedAt: {
      type: Date,
      default: null
    },

    consent: {
      accepted: {
        type: Boolean,
        default: false
      },

      policyVersion: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100
      },

      acceptedAt: {
        type: Date,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

/*
 * A user must have at least one authentication identifier.
 * This supports both email-based and phone-based authentication.
 */
userSchema.pre('validate', function (next) {
  if (!this.email && !this.phone) {
    return next(
      new Error(
        'Either email or phone number is required.'
      )
    );
  }

  next();
});

/*
 * Add login history while keeping the document size controlled.
 */
userSchema.methods.addLoginHistory = function (entry) {
  this.loginHistory.push(entry);

  if (this.loginHistory.length > 50) {
    this.loginHistory =
      this.loginHistory.slice(-50);
  }
};

/*
 * Safe authenticated-user representation.
 *
 * Authentication secrets, sessions, OTP data,
 * login history and 2FA secrets are never exposed.
 */
userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email || null,
    phone: this.phone || null,
    role: this.role,
    avatar: this.avatar || null,
    title: this.title || null,
    scrizianId: this.scrizianId || null,
    isVerified: this.isVerified,
    emailVerified: this.emailVerified,
    phoneVerified: this.phoneVerified,
    accountStatus: this.accountStatus,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/*
 * Public user representation.
 *
 * Personal authentication/contact information is not
 * exposed through the public representation.
 */
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    role: this.role,
    scrizianId: this.scrizianId || null,
    isVerified: this.isVerified
  };
};

/*
 * Query indexes.
 */
userSchema.index({
  role: 1,
  accountStatus: 1
});

userSchema.index({
  email: 1,
  accountStatus: 1
});

userSchema.index({
  phone: 1,
  accountStatus: 1
});

userSchema.index({
  'sessions.expiresAt': 1
});

userSchema.index({
  'sessions.sessionId': 1
});

module.exports = mongoose.model(
  'User',
  userSchema
);