const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    legalName: {
      type: String,
      trim: true,
      maxlength: 250
    },

    country: {
      type: String,
      required: true,
      trim: true
    },

    region: {
      type: String,
      trim: true
    },

    website: {
      type: String,
      trim: true
    },

    contactPerson: {
      name: String,
      email: String,
      phone: String
    },

    billing: {
      address: String,
      taxId: String,
      billingEmail: String
    },

    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Suspended'],
      default: 'Pending',
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Company', companySchema);