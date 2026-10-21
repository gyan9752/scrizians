const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 10000
    },

    skills: {
      type: [String],
      default: []
    },

    role: {
      type: String,
      trim: true,
      maxlength: 100
    },

    experienceMin: {
      type: Number,
      min: 0,
      default: 0
    },

    experienceMax: {
      type: Number,
      min: 0,
      default: null
    },

    engagementType: {
      type: String,
      trim: true,
      default: 'Full-time'
    },

    timezone: {
      type: String,
      trim: true,
      maxlength: 100
    },

    region: {
      type: String,
      trim: true,
      maxlength: 100
    },

    budgetMinINR: {
      type: Number,
      min: 0,
      default: null
    },

    budgetMaxINR: {
      type: Number,
      min: 0,
      default: null
    },

    budgetMinUSD: {
      type: Number,
      min: 0,
      default: null
    },

    budgetMaxUSD: {
      type: Number,
      min: 0,
      default: null
    },

    status: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Reviewing',
        'Talent Shortlisted',
        'Interview',
        'Negotiation',
        'In Progress',
        'Completed',
        'Closed',
        'Cancelled',
        'Active Sourcing',
        'Active'
      ],
      default: 'Submitted',
      index: true
    },

    source: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'client_dashboard'
    },

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

requirementSchema.pre('validate', function (next) {
  if (this.skills?.length) {
    this.skills = this.skills
      .map((skill) => String(skill).trim())
      .filter(Boolean);
  }

  if (
    this.experienceMax !== null &&
    this.experienceMax < this.experienceMin
  ) {
    return next(
      new Error(
        'Maximum experience cannot be less than minimum experience.'
      )
    );
  }

  if (
    this.budgetMaxINR !== null &&
    this.budgetMinINR !== null &&
    this.budgetMaxINR < this.budgetMinINR
  ) {
    return next(
      new Error(
        'Maximum INR budget cannot be less than minimum INR budget.'
      )
    );
  }

  if (
    this.budgetMaxUSD !== null &&
    this.budgetMinUSD !== null &&
    this.budgetMaxUSD < this.budgetMinUSD
  ) {
    return next(
      new Error(
        'Maximum USD budget cannot be less than minimum USD budget.'
      )
    );
  }

  next();
});

requirementSchema.index({
  client: 1,
  status: 1,
  createdAt: -1
});

requirementSchema.index({
  status: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  'Requirement',
  requirementSchema
);