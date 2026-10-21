const CaseStudy = require('../models/CaseStudy');

const makeSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

exports.createCaseStudy = async (req, res) => {
  try {
    const {
      title,
      clientName,
      clientPermission,
      region,
      industry,
      engagementModel,
      challenge,
      solution,
      team,
      technologyStack,
      implementation,
      securityQuality,
      results,
      category,
      services,
      heroImage,
      seo,
      deliveryTime
    } = req.body;

    const resolvedIndustry = industry || category || 'Technology';

    if (!title || !challenge || !solution) {
      return res.status(400).json({
        success: false,
        message: 'Title, challenge and solution are required.',
        requestId: req.requestId
      });
    }

    let slug = makeSlug(title);
    const exists = await CaseStudy.findOne({ slug });

    if (exists) {
      slug = `${slug}-${Date.now()}`;
    }

    const status = req.body.status || 'Published';
    const publishedAt = status === 'Published' ? (req.body.publishedAt ? new Date(req.body.publishedAt) : new Date()) : null;

    const caseStudy = await CaseStudy.create({
      title,
      slug,
      clientName: clientPermission ? clientName : undefined,
      clientPermission: Boolean(clientPermission),
      region: region || 'Global',
      industry: resolvedIndustry,
      engagementModel: engagementModel || 'Full-time',
      deliveryTime: deliveryTime || '12 wks',
      challenge,
      solution,
      team: Array.isArray(team) ? team : [],
      technologyStack: Array.isArray(technologyStack)
        ? technologyStack
        : [],
      implementation,
      securityQuality,
      results,
      category: category || 'SaaS Development',
      services: Array.isArray(services) ? services : [],
      heroImage,
      seo,
      createdBy: req.user.id,
      status,
      publishedAt
    });

    return res.status(201).json({
      success: true,
      message: 'Case study created.',
      data: caseStudy,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('createCaseStudy:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to create case study.',
      requestId: req.requestId
    });
  }
};

exports.getCaseStudies = async (req, res) => {
  try {
    const filter = {
      status: 'Published',
      deletedAt: null
    };

    if (req.query.industry) {
      filter.industry = req.query.industry;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const data = await CaseStudy.find(filter)
      .populate({
        path: 'team.talent',
        select:
          'scrizianId displayName title role experienceYears skills relationshipBadge'
      })
      .sort({ publishedAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('getCaseStudies:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch case studies.',
      requestId: req.requestId
    });
  }
};

exports.getCaseStudyBySlug = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const slug = req.params.slug;
    const query = {
      status: 'Published',
      deletedAt: null,
      $or: [{ slug: slug.toLowerCase() }]
    };

    if (mongoose.Types.ObjectId.isValid(slug)) {
      query.$or.push({ _id: slug });
    }

    const caseStudy = await CaseStudy.findOne(query).populate({
      path: 'team.talent',
      select:
        'scrizianId displayName title role experienceYears skills relationshipBadge'
    });

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: 'Case study not found.',
        requestId: req.requestId
      });
    }

    return res.status(200).json({
      success: true,
      data: caseStudy,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('getCaseStudyBySlug:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch case study.',
      requestId: req.requestId
    });
  }
};

exports.getAdminCaseStudies = async (req, res) => {
  try {
    const data = await CaseStudy.find({
      deletedAt: null
    })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch case studies.',
      requestId: req.requestId
    });
  }
};

exports.updateCaseStudy = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const id = req.params.id;
    const query = { deletedAt: null };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.slug = id.toLowerCase();
    }

    const caseStudy = await CaseStudy.findOne(query);

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: 'Case study not found.',
        requestId: req.requestId
      });
    }

    Object.assign(caseStudy, req.body);

    if (req.body.clientPermission === false) {
      caseStudy.clientName = undefined;
    }

    await caseStudy.save();

    return res.status(200).json({
      success: true,
      message: 'Case study updated.',
      data: caseStudy,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('updateCaseStudy:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update case study.',
      requestId: req.requestId
    });
  }
};

exports.reviewCaseStudy = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const id = req.params.id;
    const { status } = req.body;

    const allowedStatuses = [
      'Draft',
      'Reviewing',
      'Approved',
      'Rejected',
      'Published'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid case study status. Must be one of: ${allowedStatuses.join(', ')}`,
        requestId: req.requestId
      });
    }

    const query = { deletedAt: null };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.slug = id.toLowerCase();
    }

    const caseStudy = await CaseStudy.findOne(query);

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: 'Case study not found.',
        requestId: req.requestId
      });
    }

    caseStudy.status = status;
    if (req.user?.id) {
      caseStudy.reviewedBy = req.user.id;
    }
    if (status === 'Published' && !caseStudy.publishedAt) {
      caseStudy.publishedAt = new Date();
    }

    await caseStudy.save();

    return res.status(200).json({
      success: true,
      message: `Case study moved to ${status}.`,
      data: {
        id: caseStudy._id,
        status: caseStudy.status
      },
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to review case study.',
      requestId: req.requestId
    });
  }
};

exports.publishCaseStudy = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const id = req.params.id;
    const query = { deletedAt: null };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.slug = id.toLowerCase();
    }

    const caseStudy = await CaseStudy.findOne(query);

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: 'Case study not found.',
        requestId: req.requestId
      });
    }

    caseStudy.status = 'Published';
    caseStudy.publishedAt = new Date();

    await caseStudy.save();

    return res.status(200).json({
      success: true,
      message: 'Case study published.',
      data: {
        id: caseStudy._id,
        status: caseStudy.status,
        publishedAt: caseStudy.publishedAt
      },
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to publish case study.',
      requestId: req.requestId
    });
  }
};

exports.deleteCaseStudy = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const id = req.params.id;
    const query = { deletedAt: null };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.slug = id.toLowerCase();
    }

    const caseStudy = await CaseStudy.findOne(query);

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: 'Case study not found.',
        requestId: req.requestId
      });
    }

    caseStudy.deletedAt = new Date();
    await caseStudy.save();

    return res.status(200).json({
      success: true,
      message: 'Case study deleted.',
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to delete case study.',
      requestId: req.requestId
    });
  }
};