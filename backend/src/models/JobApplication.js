const mongoose = require('mongoose');

const jobApplicationSchema =
  new mongoose.Schema(
    {
      job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
        index: true
      },

      jobSlug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
      },

      candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
      },

      candidateScrizianId: {
        type: String,
        trim: true,
        uppercase: true,
        default: null
      },

      coverLetter: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: ''
      },

      resume: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null
      },

      status: {
        type: String,
        enum: [
          'Applied',
          'Screening',
          'Shortlisted',
          'Interview',
          'Interview Scheduled',
          'Selected',
          'Offered',
          'Joined',
          'Rejected',
          'Withdrawn'
        ],
        default: 'Applied',
        index: true
      },

      appliedAt: {
        type: Date,
        default: Date.now,
        index: true
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

// One candidate can apply to a job only once.
jobApplicationSchema.index(
  {
    job: 1,
    candidate: 1
  },
  {
    unique: true
  }
);

jobApplicationSchema.pre(
  'validate',
  function (next) {
    if (this.jobSlug) {
      this.jobSlug =
        this.jobSlug
          .trim()
          .toLowerCase();
    }

    if (this.candidateScrizianId) {
      this.candidateScrizianId =
        this.candidateScrizianId
          .trim()
          .toUpperCase();
    }

    next();
  }
);

module.exports =
  mongoose.model(
    'JobApplication',
    jobApplicationSchema
  );