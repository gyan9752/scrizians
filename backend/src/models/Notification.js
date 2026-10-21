const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        'ARTICLE_SUBMITTED',
        'ARTICLE_REVIEW',
        'ARTICLE_COMMENT',
        'ARTICLE_APPROVED',
        'ARTICLE_SCHEDULED',
        'ARTICLE_PUBLISHED',
        'LEAD',
        'INTERVIEW',
        'JOB',
        'SYSTEM'
      ],
      required: true
    },

    title: {
      type: String,
      required: true,
      maxlength: 200
    },

    message: {
      type: String,
      required: true,
      maxlength: 1000
    },

    entityType: {
      type: String,
      enum: [
        'Article',
        'Lead',
        'Interview',
        'Job',
        'System'
      ]
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },

    read: {
      type: Boolean,
      default: false,
      index: true
    },

    readAt: Date
  },
  {
    timestamps: true
  }
);

notificationSchema.index({
  recipient: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  'Notification',
  notificationSchema
);