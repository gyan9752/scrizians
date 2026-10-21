const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 2000
    },

    avatar: {
      type: String,
      trim: true
    },

    expertise: {
      type: [String],
      default: []
    },

    designation: {
      type: String,
      trim: true,
      maxlength: 150
    },

    socialLinks: {
      linkedin: String,
      github: String,
      website: String
    },

    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Suspended'],
      default: 'Pending',
      index: true
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    approvedAt: Date,

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

module.exports = mongoose.model('Author', authorSchema);
