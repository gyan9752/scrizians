const Company = require('../models/Company');

exports.createCompany = async (req, res) => {
  try {
    const existing = await Company.findOne({
      createdBy: req.user.id,
      deletedAt: null
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Company profile already exists.',
        requestId: req.requestId
      });
    }

    const {
      name,
      legalName,
      country,
      region,
      website,
      contactPerson,
      billing
    } = req.body;

    if (!name || !country) {
      return res.status(400).json({
        success: false,
        message: 'Company name and country are required.',
        requestId: req.requestId
      });
    }

    const company = await Company.create({
      name,
      legalName,
      country,
      region,
      website,
      contactPerson,
      billing,
      createdBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Company profile created.',
      data: company,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('createCompany:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to create company profile.',
      requestId: req.requestId
    });
  }
};

exports.getMyCompany = async (req, res) => {
  try {
    const company = await Company.findOne({
      createdBy: req.user.id,
      deletedAt: null
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found.',
        requestId: req.requestId
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch company profile.',
      requestId: req.requestId
    });
  }
};

exports.updateMyCompany = async (req, res) => {
  try {
    const company = await Company.findOne({
      createdBy: req.user.id,
      deletedAt: null
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company profile not found.',
        requestId: req.requestId
      });
    }

    const allowed = [
      'name',
      'legalName',
      'country',
      'region',
      'website',
      'contactPerson',
      'billing'
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });

    await company.save();

    return res.status(200).json({
      success: true,
      message: 'Company profile updated.',
      data: company,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to update company profile.',
      requestId: req.requestId
    });
  }
};