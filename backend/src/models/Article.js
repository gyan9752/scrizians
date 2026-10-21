const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
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
      trim: true,
      index: true
    },

    excerpt: {
      type: String,
      trim: true,
      maxlength: 500
    },

    content: {
      type: String,
      required: true
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: true,
      index: true
    },

    category: {
      type: String,
      trim: true,
      index: true
    },

    tags: {
      type: [String],
      default: []
    },

    featuredImage: {
      type: String
    },

    seo: {
      title: {
        type: String,
        maxlength: 200
      },

      description: {
        type: String,
        maxlength: 320
      },

      keywords: {
        type: [String],
        default: []
      },

      canonicalUrl: String,

      noIndex: {
        type: Boolean,
        default: false
      }
    },

    references: {
      type: [String],
      default: []
    },

    status: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Review',
        'Technical/Fact',
        'SEO',
        'Approved',
        'Scheduled',
        'Published',
        'Rejected'
      ],
      default: 'Draft',
      index: true
    },

    scheduledAt: Date,

    publishedAt: Date,

    rejectionReason: String,

    revisionNumber: {
      type: Number,
      default: 1
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

articleSchema.index({
  status: 1,
  createdAt: -1
});

articleSchema.index({
  category: 1,
  status: 1
});

module.exports = mongoose.model('Article', articleSchema);