const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },

    requirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Requirement',
      required: true,
      index: true
    },

    talent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TalentProfile',
      required: true,
      index: true
    },

    shortlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shortlist'
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: Date,

    commercialSummary: {
      engagementType: String,
      currency: {
        type: String,
        enum: ['INR', 'USD']
      },
      rate: Number,
      billingUnit: String,
      totalValue: Number
    },

    status: {
      type: String,
      enum: [
        'Draft',
        'Pending',
        'Active',
        'Paused',
        'Completed',
        'Cancelled'
      ],
      default: 'Draft',
      index: true
    },

    notes: {
      type: String,
      maxlength: 3000
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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

engagementSchema.index({
  client: 1,
  status: 1,
  createdAt: -1
});

module.exports = mongoose.model('Engagement', engagementSchema);