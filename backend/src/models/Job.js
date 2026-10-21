const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
      index: { unique: true, sparse: true }
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Invalid job slug format.'
      ]
    },

    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },

    location: {
      type: String,
      default: 'Remote (India / Global)',
      trim: true,
      maxlength: 200
    },

    city: {
      type: String,
      trim: true,
      maxlength: 100
    },

    country: {
      type: String,
      default: 'IN',
      trim: true,
      maxlength: 100
    },

    remote: {
      type: Boolean,
      default: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        'Full-Time',
        'Part-Time',
        'Contract'
      ],
      default: 'Full-Time',
      index: true
    },

    experienceLevel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    /*
     * Existing display fields are preserved because
     * the current frontend may already use them.
     */
    salaryRangeINR: {
      type: String,
      trim: true,
      maxlength: 100
    },

    salaryRangeUSD: {
      type: String,
      trim: true,
      maxlength: 100
    },

    /*
     * Structured salary fields for JobPosting schema.
     * These remain optional.
     */
    salaryMin: {
      type: Number,
      min: 0,
      default: null
    },

    salaryMax: {
      type: Number,
      min: 0,
      default: null
    },

    salaryCurrency: {
      type: String,
      enum: [
        'INR',
        'USD'
      ],
      default: 'INR'
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 10000
    },

    requirements: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 1000
        }
      ],
      default: []
    },

    responsibilities: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 1000
        }
      ],
      default: []
    },

    status: {
      type: String,
      enum: [
        'Active',
        'Inactive',
        'Closed',
        'Draft',
        'Archived',
        'Verified'
      ],
      default: 'Active',
      index: true
    },

    postedAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true
    },

    /*
     * Soft delete.
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
 * Normalize slug before validation/save.
 */
jobSchema.pre(
  'validate',
  function (next) {
    if (this.slug) {
      this.slug =
        this.slug
          .trim()
          .toLowerCase();
    }

    next();
  }
);

/*
 * Prevent invalid salary ranges.
 */
jobSchema.pre(
  'validate',
  function (next) {
    if (
      this.salaryMin !== null &&
      this.salaryMin !== undefined &&
      this.salaryMax !== null &&
      this.salaryMax !== undefined &&
      this.salaryMin >
        this.salaryMax
    ) {
      return next(
        new Error(
          'salaryMin cannot be greater than salaryMax.'
        )
      );
    }

    next();
  }
);

/*
 * Useful indexes for public careers pages
 * and admin job management.
 */
jobSchema.index({
  status: 1,
  postedAt: -1
});

jobSchema.index({
  status: 1,
  expiresAt: 1
});

jobSchema.index({
  department: 1,
  status: 1
});

jobSchema.index({
  remote: 1,
  status: 1
});

module.exports = mongoose.model(
  'Job',
  jobSchema
);