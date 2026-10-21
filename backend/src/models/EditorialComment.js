const mongoose = require('mongoose');

const editorialCommentSchema = new mongoose.Schema(
  {
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true
    },

    revision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ArticleRevision'
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },

    type: {
      type: String,
      enum: [
        'General',
        'Technical',
        'Fact',
        'SEO',
        'Editorial'
      ],
      default: 'General'
    },

    resolved: {
      type: Boolean,
      default: false
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    resolvedAt: Date
  },
  {
    timestamps: true
  }
);

editorialCommentSchema.index({
  article: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  'EditorialComment',
  editorialCommentSchema
);
