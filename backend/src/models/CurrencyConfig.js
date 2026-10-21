const mongoose = require('mongoose');

const currencyConfigSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      enum: ['INR', 'USD'],
      required: true,
      unique: true
    },

    symbol: {
      type: String,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    active: {
      type: Boolean,
      default: true
    },

    displayOrder: {
      type: Number,
      default: 0
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('CurrencyConfig', currencyConfigSchema);