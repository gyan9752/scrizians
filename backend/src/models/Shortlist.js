const mongoose = require('mongoose');

const shortlistSchema = new mongoose.Schema(
  {
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

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: [
        'Shortlisted',
        'Interview',
        'Selected',
        'Rejected',
        'Withdrawn'
      ],
      default: 'Shortlisted',
      index: true
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: ''
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

shortlistSchema.index(
  {
    requirement: 1,
    talent: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  'Shortlist',
  shortlistSchema
);