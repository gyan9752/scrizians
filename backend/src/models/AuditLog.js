const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      index: true
    },

    performedBy: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      index: true
    },

    role: {
      type: String,
      required: true,
      enum: [
        'scrizian',
        'client',
        'contributor',
        'candidate',
        'scriza_staff',
        'admin',
        'system'
      ],
      index: true
    },

    /*
     * Optional target information.
     * Useful when an admin/staff member changes
     * a specific user, talent profile, lead, job, etc.
     */
    targetType: {
      type: String,
      trim: true,
      maxlength: 100
    },

    targetId: {
      type: String,
      trim: true,
      maxlength: 150
    },

    /*
     * Human-readable audit details.
     */
    details: {
      type: String,
      trim: true,
      maxlength: 5000
    },

    /*
     * Structured metadata for audit/debugging.
     * Do not store passwords, OTPs, refresh tokens,
     * access tokens or other secrets here.
     */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined
    },

    /*
     * Request correlation ID.
     */
    requestId: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true
    },

    /*
     * Request information.
     */
    ipAddress: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100
    },

    userAgent: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

/*
 * Useful indexes for admin audit-log queries.
 */
auditLogSchema.index({
  performedBy: 1,
  timestamp: -1
});

auditLogSchema.index({
  action: 1,
  timestamp: -1
});

auditLogSchema.index({
  role: 1,
  timestamp: -1
});

auditLogSchema.index({
  targetType: 1,
  targetId: 1,
  timestamp: -1
});

module.exports = mongoose.model(
  'AuditLog',
  auditLogSchema
);