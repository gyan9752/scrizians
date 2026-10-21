const mongoose = require('mongoose');

const interviewRequestSchema = new mongoose.Schema(
  {
    requirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Requirement',
      required: true,
      index: true
    },

    shortlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shortlist',
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

    scheduledAt: {
      type: Date,
      default: null
    },

    timezone: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'Asia/Kolkata'
    },

    meetingLink: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null
    },

    message: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: ''
    },

    status: {
      type: String,
      enum: [
        'Requested',
        'Confirmed',
        'Rescheduled',
        'Completed',
        'Cancelled',
        'Rejected'
      ],
      default: 'Requested',
      index: true
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

interviewRequestSchema.index(
  {
    client: 1,
    status: 1,
    createdAt: -1
  }
);

interviewRequestSchema.index(
  {
    talent: 1,
    status: 1,
    scheduledAt: 1
  }
);

module.exports = mongoose.model(
  'InterviewRequest',
  interviewRequestSchema
);