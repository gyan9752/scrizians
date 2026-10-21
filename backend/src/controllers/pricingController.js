const PricingConfig = require('../models/PricingConfig');
const CurrencyConfig = require('../models/CurrencyConfig');

exports.getPublicPricing = async (req, res) => {
  try {
    const [pricing, currencies] = await Promise.all([
      PricingConfig.find({ active: true })
        .select(
          'engagementType billingUnit inr usd displayLabel indicative'
        )
        .sort({ engagementType: 1 }),

      CurrencyConfig.find({ active: true })
        .select('code symbol name displayOrder')
        .sort({ displayOrder: 1 })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        pricing,
        currencies
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error('getPublicPricing:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch pricing.',
      requestId: req.requestId
    });
  }
};

exports.getPricingAdmin = async (req, res) => {
  try {
    const pricing = await PricingConfig.find()
      .populate('updatedBy', 'name email')
      .sort({ engagementType: 1 });

    const currencies = await CurrencyConfig.find()
      .populate('updatedBy', 'name email')
      .sort({ displayOrder: 1 });

    return res.status(200).json({
      success: true,
      data: {
        pricing,
        currencies
      },
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch pricing configuration.',
      requestId: req.requestId
    });
  }
};

exports.upsertPricing = async (req, res) => {
  try {
    const {
      engagementType,
      billingUnit,
      inr,
      usd,
      displayLabel,
      indicative,
      active
    } = req.body;

    if (!engagementType || !billingUnit) {
      return res.status(400).json({
        success: false,
        message: 'Engagement type and billing unit are required.',
        requestId: req.requestId
      });
    }

    const pricing = await PricingConfig.findOneAndUpdate(
      { engagementType },
      {
        engagementType,
        billingUnit,
        inr,
        usd,
        displayLabel,
        indicative,
        active,
        updatedBy: req.user.id
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Pricing configuration saved.',
      data: pricing,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('upsertPricing:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to save pricing.',
      requestId: req.requestId
    });
  }
};

exports.upsertCurrency = async (req, res) => {
  try {
    const { code, symbol, name, active, displayOrder } = req.body;

    if (!code || !symbol || !name) {
      return res.status(400).json({
        success: false,
        message: 'Currency code, symbol and name are required.',
        requestId: req.requestId
      });
    }

    const currency = await CurrencyConfig.findOneAndUpdate(
      { code },
      {
        code,
        symbol,
        name,
        active,
        displayOrder,
        updatedBy: req.user.id
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Currency configuration saved.',
      data: currency,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to save currency configuration.',
      requestId: req.requestId
    });
  }
};