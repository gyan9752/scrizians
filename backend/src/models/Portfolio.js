const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    talent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TalentProfile',
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    industry: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    projectType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    role: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    techStack: {
      type: [String],
      default: []
    },

    media: [
      {
        url: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['image', 'video', 'document'],
          default: 'image'
        },
        alt: {
          type: String,
          trim: true,
          maxlength: 250
        },
        approved: {
          type: Boolean,
          default: false
        }
      }
    ],

    duration: {
      type: String,
      trim: true,
      maxlength: 100
    },

    outcome: {
      type: String,
      trim: true,
      maxlength: 2000
    },

    clientName: {
      type: String,
      trim: true,
      maxlength: 200
    },

    clientNamePermission: {
      type: Boolean,
      default: false
    },

    liveUrl: {
      type: String,
      trim: true
    },

    repositoryUrl: {
      type: String,
      trim: true
    },

    publicLinksApproved: {
      type: Boolean,
      default: false
    },

    ndaProtected: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Changes Requested', 'Approved', 'Rejected', 'Active', 'Inactive', 'Published'],
      default: 'Draft',
      index: true
    },

    seo: {
      index: {
        type: Boolean,
        default: false
      },
      title: {
        type: String,
        trim: true,
        maxlength: 200
      },
      description: {
        type: String,
        trim: true,
        maxlength: 320
      }
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    reviewedAt: Date,

    reviewComment: {
      type: String,
      trim: true,
      maxlength: 2000
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

portfolioSchema.index({ talent: 1, status: 1 });
portfolioSchema.index({ slug: 1, status: 1 });

module.exports = mongoose.model('Portfolio', portfolioSchema);