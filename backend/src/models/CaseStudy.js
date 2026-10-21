const mongoose = require('mongoose');

const caseStudySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    clientName: {
      type: String,
      trim: true,
      maxlength: 200
    },

    clientPermission: {
      type: Boolean,
      default: false
    },

    region: {
      type: String,
      trim: true
    },

    industry: {
      type: String,
      required: true,
      trim: true
    },

    engagementModel: {
      type: String,
      trim: true
    },

    deliveryTime: {
      type: String,
      trim: true,
      default: '12 wks'
    },

    challenge: {
      type: String,
      required: true,
      maxlength: 5000
    },

    solution: {
      type: String,
      required: true,
      maxlength: 5000
    },

    team: [
      {
        talent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TalentProfile'
        },
        role: String
      }
    ],

    technologyStack: {
      type: [String],
      default: []
    },

    implementation: {
      type: String,
      maxlength: 5000
    },

    securityQuality: {
      type: String,
      maxlength: 3000
    },

    results: {
      type: String,
      maxlength: 5000
    },

    category: {
      type: String,
      trim: true
    },

    services: {
      type: [String],
      default: []
    },

    heroImage: {
      type: String
    },

    status: {
      type: String,
      enum: ['Draft', 'Reviewing', 'Approved', 'Published', 'Rejected'],
      default: 'Draft',
      index: true
    },

    seo: {
      title: String,
      description: String,
      index: {
        type: Boolean,
        default: false
      }
    },

    publishedAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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

caseStudySchema.index({ status: 1, createdAt: -1 });
caseStudySchema.index({ industry: 1, status: 1 });

module.exports = mongoose.model('CaseStudy', caseStudySchema);