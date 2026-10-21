const mongoose = require('mongoose');

const pricingConfigSchema = new mongoose.Schema(
  {
    engagementType: {
      type: String,
      enum: [
        'Hourly Talent',
        'Part-Time Resource',
        'Dedicated Developer',
        'Senior / Specialist',
        'Dedicated Team',
        'Project-Based'
      ],
      required: true,
      unique: true
    },

    billingUnit: {
      type: String,
      enum: ['Hourly', 'Monthly', 'Milestone', 'Project'],
      required: true
    },

    inr: {
      from: Number,
      to: Number
    },

    usd: {
      from: Number,
      to: Number
    },

    displayLabel: {
      type: String,
      trim: true
    },

    indicative: {
      type: Boolean,
      default: true
    },

    active: {
      type: Boolean,
      default: true
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PricingConfig', pricingConfigSchema);