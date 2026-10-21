const mongoose = require('mongoose');

const articleRevisionSchema = new mongoose.Schema(
  {
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
      index: true
    },

    version: {
      type: Number,
      required: true
    },

    title: String,

    excerpt: String,

    content: String,

    category: String,

    tags: {
      type: [String],
      default: []
    },

    seo: {
      title: String,
      description: String,
      keywords: [String],
      canonicalUrl: String,
      noIndex: Boolean
    },

    references: {
      type: [String],
      default: []
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    changeNote: {
      type: String,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

articleRevisionSchema.index({
  article: 1,
  version: -1
});

module.exports = mongoose.model(
  'ArticleRevision',
  articleRevisionSchema
);