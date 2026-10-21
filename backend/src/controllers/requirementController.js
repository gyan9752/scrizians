const Requirement = require('../models/Requirement');

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

const normalizeString = (value, maxLength = 500) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value)
    .trim()
    .slice(0, maxLength);
};

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return [
    ...new Set(
      skills
        .map((skill) => normalizeString(skill, 100))
        .filter(Boolean)
    )
  ].slice(0, 50);
};

const getPagination = (req) => {
  const page = Math.max(
    Number.parseInt(req.query.page, 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number.parseInt(req.query.limit, 10) || DEFAULT_LIMIT,
      1
    ),
    MAX_LIMIT
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

const getRequirementData = (body = {}) => {
  const desc =
    body.description ||
    body.scope ||
    body.scopeDescription ||
    (body.title ? `Requirement for ${body.title} - Sourcing top technical specialists.` : 'Staffing requirement submitted via client portal.');
  const rawSkills = body.skills || body.requiredSkills || [];
  const role = body.role || body.title || 'Technical Specialist';
  const engType = body.engagementType || body.engagementModel || 'Full-time';

  return {
    title: normalizeString(body.title, 200),
    description: normalizeString(desc, 10000),
    skills: normalizeSkills(rawSkills),
    role: normalizeString(role, 100),
    experienceMin:
      body.experienceMin !== undefined && body.experienceMin !== ''
        ? Number(body.experienceMin)
        : 0,
    experienceMax:
      body.experienceMax !== undefined && body.experienceMax !== ''
        ? Number(body.experienceMax)
        : null,
    engagementType: normalizeString(engType, 50) || 'Full-time',
    timezone: normalizeString(body.timezone || body.timezonePreference, 100),
    region: normalizeString(body.region, 100),
    status: body.status || 'Submitted',
    budgetMinINR:
      body.budgetMinINR !== undefined && body.budgetMinINR !== ''
        ? Number(body.budgetMinINR)
        : null,
    budgetMaxINR:
      body.budgetMaxINR !== undefined && body.budgetMaxINR !== ''
        ? Number(body.budgetMaxINR)
        : null,
    budgetMinUSD:
      body.budgetMinUSD !== undefined && body.budgetMinUSD !== ''
        ? Number(body.budgetMinUSD)
        : null,
    budgetMaxUSD:
      body.budgetMaxUSD !== undefined && body.budgetMaxUSD !== ''
        ? Number(body.budgetMaxUSD)
        : null,
    source: normalizeString(body.source, 100) || 'client_dashboard'
  };
};

const validateRequirementData = (data) => {
  if (!data.title || data.title.length < 3) {
    return 'Requirement title must be at least 3 characters.';
  }

  if (!data.description || data.description.length < 5) {
    data.description = `Requirement for ${data.title || 'engineering talent'} submitted via client portal.`;
  }

  if (
    Number.isNaN(data.experienceMin) ||
    data.experienceMin < 0
  ) {
    return 'Minimum experience is invalid.';
  }

  if (
    data.experienceMax !== null &&
    (
      Number.isNaN(data.experienceMax) ||
      data.experienceMax < data.experienceMin
    )
  ) {
    return 'Maximum experience cannot be less than minimum experience.';
  }

  if (
    data.budgetMinINR !== null &&
    (
      Number.isNaN(data.budgetMinINR) ||
      data.budgetMinINR < 0
    )
  ) {
    return 'Minimum INR budget is invalid.';
  }

  if (
    data.budgetMaxINR !== null &&
    (
      Number.isNaN(data.budgetMaxINR) ||
      data.budgetMaxINR < data.budgetMinINR
    )
  ) {
    return 'Maximum INR budget cannot be less than minimum INR budget.';
  }

  if (
    data.budgetMinUSD !== null &&
    (
      Number.isNaN(data.budgetMinUSD) ||
      data.budgetMinUSD < 0
    )
  ) {
    return 'Minimum USD budget is invalid.';
  }

  if (
    data.budgetMaxUSD !== null &&
    (
      Number.isNaN(data.budgetMaxUSD) ||
      data.budgetMaxUSD < data.budgetMinUSD
    )
  ) {
    return 'Maximum USD budget cannot be less than minimum USD budget.';
  }

  return null;
};

/**
 * Create client requirement
 */
exports.createRequirement = async (req, res) => {
  try {
    const data = getRequirementData(req.body);

    const validationError =
      validateRequirementData(data);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
        requestId: req.requestId
      });
    }

    const requirement =
      await Requirement.create({
        ...data,
        client: req.user.id,
        status: data.status || 'Submitted'
      });

    return res.status(201).json({
      success: true,
      message: 'Requirement created successfully.',
      data: requirement,
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Requirements] Create error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to create requirement.',
      requestId: req.requestId
    });
  }
};

/**
 * Get client's own requirements
 */
exports.getMyRequirements = async (req, res) => {
  try {
    const { page, limit, skip } =
      getPagination(req);

    const filter = {
      client: req.user.id,
      deletedAt: null
    };

    const [requirements, total] =
      await Promise.all([
        Requirement.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .maxTimeMS(5000),

        Requirement.countDocuments(filter)
      ]);

    return res.status(200).json({
      success: true,
      data: requirements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Requirements] List error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch requirements.',
      requestId: req.requestId
    });
  }
};

/**
 * Get one client requirement
 */
exports.getRequirementById = async (req, res) => {
  try {
    const requirement =
      await Requirement.findOne({
        _id: req.params.id,
        client: req.user.id,
        deletedAt: null
      })
        .lean()
        .maxTimeMS(5000);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found.',
        requestId: req.requestId
      });
    }

    return res.status(200).json({
      success: true,
      data: requirement,
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Requirements] Get error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch requirement.',
      requestId: req.requestId
    });
  }
};

/**
 * Update client requirement
 */
exports.updateRequirement = async (req, res) => {
  try {
    const requirement =
      await Requirement.findOne({
        _id: req.params.id,
        client: req.user.id,
        deletedAt: null
      });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found.',
        requestId: req.requestId
      });
    }

    if (req.body.status) {
      requirement.status = req.body.status;
      await requirement.save();
      return res.status(200).json({
        success: true,
        message: `Requirement status updated to ${req.body.status}.`,
        data: requirement,
        requestId: req.requestId
      });
    }

    if (
      [
        'Completed',
        'Closed'
      ].includes(requirement.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Closed or completed requirements cannot be edited.',
        requestId: req.requestId
      });
    }

    const data = getRequirementData(req.body);

    const validationError =
      validateRequirementData(data);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
        requestId: req.requestId
      });
    }

    Object.assign(requirement, data);

    await requirement.save();

    return res.status(200).json({
      success: true,
      message: 'Requirement updated successfully.',
      data: requirement,
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Requirements] Update error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to update requirement.',
      requestId: req.requestId
    });
  }
};

/**
 * Submit requirement for review
 */
exports.submitRequirement = async (req, res) => {
  try {
    const requirement =
      await Requirement.findOne({
        _id: req.params.id,
        client: req.user.id,
        deletedAt: null
      });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found.',
        requestId: req.requestId
      });
    }

    if (
      !['Draft', 'Submitted'].includes(
        requirement.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Requirement cannot be submitted at its current stage.',
        requestId: req.requestId
      });
    }

    const validationError =
      validateRequirementData(requirement.toObject());

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
        requestId: req.requestId
      });
    }

    requirement.status = 'Submitted';

    await requirement.save();

    return res.status(200).json({
      success: true,
      message:
        'Requirement submitted successfully.',
      data: {
        id: requirement._id,
        status: requirement.status
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Requirements] Submit error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to submit requirement.',
      requestId: req.requestId
    });
  }
};

/**
 * Soft delete requirement
 */
exports.deleteRequirement = async (req, res) => {
  try {
    const requirement =
      await Requirement.findOne({
        _id: req.params.id,
        client: req.user.id,
        deletedAt: null
      });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found.',
        requestId: req.requestId
      });
    }

    requirement.deletedAt = new Date();

    await requirement.save();

    return res.status(200).json({
      success: true,
      message:
        'Requirement deleted successfully.',
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Requirements] Delete error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to delete requirement.',
      requestId: req.requestId
    });
  }
};