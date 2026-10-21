const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
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
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      index: true
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30
    },

    company: {
      type: String,
      trim: true,
      maxlength: 150
    },

    serviceRequested: {
      type: String,
      default: 'General Enquiry / Talent Hiring',
      trim: true,
      maxlength: 150
    },

    message: {
      type: String,
      default: 'Enquiry submitted via Scriza website.',
      trim: true,
      maxlength: 5000
    },

    scrizianIdReferenced: {
      type: String,
      trim: true,
      uppercase: true,
      match: [
        /^(SCR-\d+|SZN-[A-Z]+-\d+|[A-Z0-9-]+)$/i,
        'Invalid Scrizian ID format.'
      ],
      index: true
    },

    /*
     * Lead source and marketing attribution
     */
    source: {
      type: String,
      default: 'website',
      trim: true,
      maxlength: 100,
      index: true
    },

    utmSource: {
      type: String,
      default: 'direct',
      trim: true,
      maxlength: 100
    },

    utmMedium: {
      type: String,
      trim: true,
      maxlength: 100
    },

    utmCampaign: {
      type: String,
      trim: true,
      maxlength: 150
    },

    utmTerm: {
      type: String,
      trim: true,
      maxlength: 150
    },

    utmContent: {
      type: String,
      trim: true,
      maxlength: 150
    },

    referrer: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    /*
     * Request metadata for abuse detection,
     * audit and lead-source analysis.
     */
    ipAddress: {
      type: String,
      select: false,
      trim: true,
      maxlength: 100
    },

    userAgent: {
      type: String,
      select: false,
      trim: true,
      maxlength: 1000
    },

    /*
     * CRM Lead Lifecycle
     *
     * Blueprint flow:
     * New → Contacted → Qualified →
     * Requirement Confirmed → Talent Shortlisted →
     * Interview → Negotiation → Won/Lost/Nurture
     */
    stage: {
      type: String,
      enum: [
        'New',
        'Contacted',
        'Qualified',
        'Requirement Confirmed',
        'Confirmed',
        'Talent Shortlisted',
        'Shortlisted',
        'Interview',
        'Negotiation',
        'Won',
        'Won / Closed',
        'Closed',
        'In Progress',
        'Lost',
        'Nurture'
      ],
      default: 'New',
      index: true
    },

    /*
     * Soft-delete support
     */
    deletedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

/*
 * Normalize Scrizian ID before validation/save.
 */
leadSchema.pre(
  'validate',
  function (next) {
    if (this.scrizianIdReferenced) {
      this.scrizianIdReferenced =
        this.scrizianIdReferenced
          .trim()
          .toUpperCase();
    }

    next();
  }
);

/*
 * Useful indexes for CRM/admin queries.
 */
leadSchema.index({
  createdAt: -1
});

leadSchema.index({
  stage: 1,
  createdAt: -1
});

leadSchema.index({
  source: 1,
  createdAt: -1
});

leadSchema.index({
  scrizianIdReferenced: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  'Lead',
  leadSchema
);