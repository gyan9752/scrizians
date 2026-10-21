const TalentProfile = require('../models/TalentProfile');

/*
 * Maximum number of talent profiles returned in a
 * single public request.
 */
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 12;

/*
 * Normalize query values safely.
 */
const normalizeQueryValue = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
};

/*
 * Parse pagination values safely.
 */
const parsePagination = (req) => {
  const pageValue = Number.parseInt(req.query.page, 10);
  const limitValue = Number.parseInt(req.query.limit, 10);

  const page =
    Number.isInteger(pageValue) && pageValue > 0
      ? pageValue
      : 1;

  const limit =
    Number.isInteger(limitValue) && limitValue > 0
      ? Math.min(limitValue, MAX_LIMIT)
      : DEFAULT_LIMIT;

  return {
    page,
    limit
  };
};

/*
 * Escape user input before using it inside
 * a MongoDB regular expression.
 */
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/*
 * Fields that a Scrizian is allowed to manage
 * through the onboarding profile API.
 */
const PROFILE_FIELDS = [
  'displayName',
  'title',
  'summary',
  'role',
  'experienceYears',
  'skills',
  'categories',
  'timezone',
  'region',
  'availability',
  'engagementPreference',
  'languages',
  'relationshipBadge',
  'hourlyRateUSD',
  'monthlyRateINR',
  'resume',
  'expectedCompensation'
];

/*
 * Copy only allowed profile fields from request body.
 */
const pickProfileFields = (body = {}) => {
  const profileData = {};

  PROFILE_FIELDS.forEach((field) => {
    if (
      Object.prototype.hasOwnProperty.call(body, field)
    ) {
      profileData[field] = body[field];
    }
  });

  return profileData;
};

/*
 * Basic validation for profile input.
 */
const validateProfileData = (data) => {
  const errors = [];

  if (
    data.displayName !== undefined &&
    (
      typeof data.displayName !== 'string' ||
      data.displayName.trim().length < 2
    )
  ) {
    errors.push(
      'Display name must contain at least 2 characters.'
    );
  }

  if (
    data.title !== undefined &&
    (
      typeof data.title !== 'string' ||
      data.title.trim().length < 2
    )
  ) {
    errors.push(
      'Title must contain at least 2 characters.'
    );
  }

  if (
    data.summary !== undefined &&
    typeof data.summary !== 'string'
  ) {
    errors.push('Summary must be a string.');
  }

  if (data.experienceYears !== undefined) {
    const experienceYears = Number(
      data.experienceYears
    );

    if (
      !Number.isFinite(experienceYears) ||
      experienceYears < 0 ||
      experienceYears > 60
    ) {
      errors.push(
        'Experience must be between 0 and 60 years.'
      );
    }

    data.experienceYears = experienceYears;
  }

  if (
    data.skills !== undefined &&
    !Array.isArray(data.skills)
  ) {
    errors.push('Skills must be an array.');
  }

  if (
    data.categories !== undefined &&
    !Array.isArray(data.categories)
  ) {
    errors.push('Categories must be an array.');
  }

  if (
    data.languages !== undefined &&
    !Array.isArray(data.languages)
  ) {
    errors.push('Languages must be an array.');
  }

  if (
    data.hourlyRateUSD !== undefined &&
    data.hourlyRateUSD !== null
  ) {
    const hourlyRate = Number(
      data.hourlyRateUSD
    );

    if (
      !Number.isFinite(hourlyRate) ||
      hourlyRate < 0
    ) {
      errors.push(
        'Hourly USD rate must be a valid positive number.'
      );
    }

    data.hourlyRateUSD = hourlyRate;
  }

  if (
    data.monthlyRateINR !== undefined &&
    data.monthlyRateINR !== null
  ) {
    const monthlyRate = Number(
      data.monthlyRateINR
    );

    if (
      !Number.isFinite(monthlyRate) ||
      monthlyRate < 0
    ) {
      errors.push(
        'Monthly INR rate must be a valid positive number.'
      );
    }

    data.monthlyRateINR = monthlyRate;
  }

  return errors;
};

/*
 * GET /api/v1/talent
 *
 * Public Talent Directory.
 */
exports.getPublicTalent = async (req, res) => {
  try {
    const category =
      normalizeQueryValue(req.query.category);

    const skill =
      normalizeQueryValue(req.query.skill);

    const search =
      normalizeQueryValue(req.query.search);

    const availability =
      normalizeQueryValue(req.query.availability);

    const role =
      normalizeQueryValue(req.query.role);

    const experience =
      normalizeQueryValue(req.query.experience);

    const timezone =
      normalizeQueryValue(req.query.timezone);

    const region =
      normalizeQueryValue(req.query.region);

    const engagement =
      normalizeQueryValue(req.query.engagement);

    const verification =
      normalizeQueryValue(req.query.verification);

    const {
      page,
      limit
    } = parsePagination(req);

    const filter = {
      status: { $in: ['approved', 'Verified'] },
      deletedAt: null
    };

    if (category) {
      filter.categories = {
        $in: [category]
      };
    }

    if (skill) {
      filter.skills = {
        $elemMatch: {
          $regex: escapeRegex(skill),
          $options: 'i'
        }
      };
    }

    if (availability) {
      filter.availability = availability;
    }

    if (role) {
      filter.role = {
        $regex: escapeRegex(role),
        $options: 'i'
      };
    }

    if (experience) {
      const experienceYears = Number(experience);

      if (
        Number.isFinite(experienceYears) &&
        experienceYears >= 0
      ) {
        filter.experienceYears = {
          $gte: experienceYears
        };
      }
    }

    if (timezone) {
      filter.timezone = {
        $regex: escapeRegex(timezone),
        $options: 'i'
      };
    }

    if (region) {
      filter.region = {
        $regex: escapeRegex(region),
        $options: 'i'
      };
    }

    if (engagement) {
      filter.engagementPreference = engagement;
    }

    if (verification) {
      filter.verificationStatus = verification;
    }

    if (search) {
      const searchRegex = {
        $regex: escapeRegex(search),
        $options: 'i'
      };

      filter.$or = [
        {
          scrizianId: searchRegex
        },
        {
          title: searchRegex
        },
        {
          summary: searchRegex
        },
        {
          role: searchRegex
        },
        {
          skills: searchRegex
        },
        {
          categories: searchRegex
        }
      ];
    }

    const skip = (page - 1) * limit;

    const [
      total,
      profiles
    ] = await Promise.all([
      TalentProfile.countDocuments(filter),

      TalentProfile.find(filter)
        .sort({
          createdAt: -1,
          _id: -1
        })
        .skip(skip)
        .limit(limit)
        .maxTimeMS(5000)
    ]);

    const data = profiles.map(
      (profile) => profile.toPublicJSON()
    );

    const totalPages =
      total > 0
        ? Math.ceil(total / limit)
        : 0;

    return res.status(200).json({
      success: true,
      count: data.length,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      data
    });
  } catch (error) {
    console.error(
      '[Talent] Public directory error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to load the talent directory.',
      requestId: req.requestId
    });
  }
};

/*
 * GET /api/v1/talent/:scrizianId
 *
 * Public stable Scrizian profile.
 */
exports.getTalentById = async (req, res) => {
  try {
    const scrizianId =
      normalizeQueryValue(
        req.params.scrizianId
      );

    if (!scrizianId) {
      return res.status(400).json({
        success: false,
        message: 'Scrizian ID is required.',
        requestId: req.requestId
      });
    }

    const normalizedScrizianId =
      scrizianId.toUpperCase();

    if (
      !/^(SCR-\d+|SZN-[A-Z]+-\d+|[A-Z0-9-]+)$/i.test(
        normalizedScrizianId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid Scrizian ID format.',
        requestId: req.requestId
      });
    }

    const profile =
      await TalentProfile.findOne({
        scrizianId: normalizedScrizianId,
        status: 'approved'
      }).maxTimeMS(5000);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          'Scrizian profile not found.',
        requestId: req.requestId
      });
    }

    const data = profile.toPublicJSON();

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error(
      '[Talent] Profile lookup error:',
      {
        requestId: req.requestId,
        scrizianId: req.params.scrizianId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to load the talent profile.',
      requestId: req.requestId
    });
  }
};

/*
 * GET /api/v1/talent/profile/me
 *
 * Get the currently logged-in Scrizian's
 * private talent profile.
 *
 * IMPORTANT:
 * New Scrizian accounts do not have a profile yet.
 * That is a valid dashboard state, so return 200
 * with data: null instead of 404.
 */
exports.getMyProfile = async (req, res) => {
  try {
    const scrizianId =
      req.user?.scrizianId;

    if (!scrizianId) {
      return res.status(400).json({
        success: false,
        message:
          'Scrizian ID is not available for this account.',
        requestId: req.requestId
      });
    }

    const profile =
      await TalentProfile.findOne({
        scrizianId:
          scrizianId.toUpperCase()
      });

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: null,
        message:
          'Talent profile has not been created yet.',
        requestId: req.requestId
      });
    }

    /*
     * Private owner endpoint.
     */
    const data = profile.toObject();

    delete data.__v;

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error(
      '[Talent] Get own profile error:',
      {
        requestId: req.requestId,
        userId: req.user?.id,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to load your talent profile.',
      requestId: req.requestId
    });
  }
};

/*
 * POST /api/v1/talent/profile
 *
 * Create a talent profile for the currently
 * authenticated Scrizian.
 */
exports.createProfile = async (req, res) => {
  try {
    const scrizianId =
      req.user?.scrizianId;

    if (!scrizianId) {
      return res.status(400).json({
        success: false,
        message:
          'Scrizian ID is required before creating a talent profile.',
        requestId: req.requestId
      });
    }

    const normalizedScrizianId =
      scrizianId.toUpperCase();

    const existingProfile =
      await TalentProfile.findOne({
        scrizianId:
          normalizedScrizianId
      });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message:
          'A talent profile already exists for this Scrizian.',
        requestId: req.requestId
      });
    }

    const profileData =
      pickProfileFields(req.body);

    const validationErrors =
      validateProfileData(profileData);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid talent profile data.',
        errors: validationErrors,
        requestId: req.requestId
      });
    }

    /*
     * New profiles always start as draft.
     */
    const profile =
      new TalentProfile({
        ...profileData,

        scrizianId:
          normalizedScrizianId,

        status: 'draft',

        email:
          req.user?.email || undefined,

        phone:
          req.user?.phone || undefined
      });

    await profile.save();

    return res.status(201).json({
      success: true,
      message:
        'Talent profile created successfully.',
      data: profile.toObject(),
      requestId: req.requestId
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          'A talent profile already exists for this Scrizian.',
        requestId: req.requestId
      });
    }

    console.error(
      '[Talent] Create profile error:',
      {
        requestId: req.requestId,
        userId: req.user?.id,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to create the talent profile.',
      requestId: req.requestId
    });
  }
};

/*
 * PUT /api/v1/talent/profile
 *
 * Update the currently authenticated Scrizian's
 * own profile.
 */
exports.updateProfile = async (req, res) => {
  try {
    const scrizianId =
      req.user?.scrizianId;

    if (!scrizianId) {
      return res.status(400).json({
        success: false,
        message:
          'Scrizian ID is required.',
        requestId: req.requestId
      });
    }

    const normalizedScrizianId =
      scrizianId.toUpperCase();

    const profile =
      await TalentProfile.findOne({
        scrizianId:
          normalizedScrizianId
      });

    /*
     * PUT is only for an existing profile.
     * New profiles must use POST /profile.
     */
    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          'Talent profile has not been created yet.',
        requestId: req.requestId
      });
    }

    // Allow approved talent to update operational availability, rates, timezone, and profile settings


    if (profile.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message:
          'Suspended profiles cannot be updated.',
        requestId: req.requestId
      });
    }

    const profileData =
      pickProfileFields(req.body);

    const validationErrors =
      validateProfileData(profileData);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid talent profile data.',
        errors: validationErrors,
        requestId: req.requestId
      });
    }

    Object.keys(profileData).forEach(
      (field) => {
        profile[field] =
          profileData[field];
      }
    );

    if (profile.status === 'rejected') {
      profile.status = 'draft';
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message:
        'Talent profile updated successfully.',
      data: profile.toObject(),
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Talent] Update profile error:',
      {
        requestId: req.requestId,
        userId: req.user?.id,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to update the talent profile.',
      requestId: req.requestId
    });
  }
};

/*
 * POST /api/v1/talent/profile/submit-verification
 *
 * Submit the current profile for admin review.
 */
exports.submitForVerification = async (req, res) => {
  try {
    const scrizianId =
      req.user?.scrizianId;

    if (!scrizianId) {
      return res.status(400).json({
        success: false,
        message:
          'Scrizian ID is required.',
        requestId: req.requestId
      });
    }

    const normalizedScrizianId =
      scrizianId.toUpperCase();

    const profile =
      await TalentProfile.findOne({
        scrizianId:
          normalizedScrizianId
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          'Create your talent profile before submitting it for verification.',
        requestId: req.requestId
      });
    }

    if (profile.status === 'approved') {
      return res.status(400).json({
        success: false,
        message:
          'This talent profile is already approved.',
        requestId: req.requestId
      });
    }

    if (profile.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message:
          'Suspended profiles cannot be submitted for verification.',
        requestId: req.requestId
      });
    }

    const missingFields = [];

    if (!profile.displayName) {
      missingFields.push('displayName');
    }

    if (!profile.title) {
      missingFields.push('title');
    }

    if (!profile.role) {
      missingFields.push('role');
    }

    if (
      profile.experienceYears === undefined ||
      profile.experienceYears === null
    ) {
      missingFields.push('experienceYears');
    }

    if (
      !Array.isArray(profile.skills) ||
      profile.skills.length === 0
    ) {
      missingFields.push('skills');
    }

    if (!profile.availability) {
      missingFields.push('availability');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Complete the required profile fields before submitting for verification.',
        missingFields,
        requestId: req.requestId
      });
    }

    profile.status = 'pending';

    profile.reviewedBy = undefined;
    profile.reviewedAt = undefined;
    profile.rejectionReason = undefined;

    await profile.save();

    return res.status(200).json({
      success: true,
      message:
        'Talent profile submitted for verification.',
      data: {
        scrizianId:
          profile.scrizianId,
        status:
          profile.status
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Talent] Verification submission error:',
      {
        requestId: req.requestId,
        userId: req.user?.id,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to submit the talent profile for verification.',
      requestId: req.requestId
    });
  }
};

/*
 * Route naming aliases.
 */
exports.getTalents =
  exports.getPublicTalent;

exports.getTalentByScrizianId =
  exports.getTalentById;

/*
 * ADMIN TALENT MANAGEMENT
 */
exports.adminCreateTalent = async (req, res) => {
  try {
    let {
      scrizianId,
      id,
      displayName,
      title,
      summary,
      role,
      experienceYears,
      skills,
      availability,
      hourlyRateUSD,
      monthlyRateINR,
      status,
      avatarUrl
    } = req.body;

    let targetId = scrizianId || id;
    if (!targetId || !/^(SCR-\d+|SZN-[A-Z]+-\d+|[A-Z0-9-]+)$/i.test(targetId)) {
      targetId = `SZN-DEV-${Math.floor(10000 + Math.random() * 90000)}`;
    }
    targetId = targetId.toUpperCase();

    let rawSkills = skills;
    let finalSkills = [];
    if (typeof rawSkills === 'string') {
      finalSkills = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(rawSkills)) {
      finalSkills = rawSkills.filter(s => typeof s === 'string' && s.trim());
    }
    if (finalSkills.length === 0) {
      finalSkills = ['Full Stack', 'Node.js', 'React'];
    }

    const talent = await TalentProfile.create({
      user: req.user.id,
      scrizianId: targetId,
      displayName: displayName || 'Scrizian Engineer',
      title: title || 'Full Stack Developer',
      summary: summary || `${displayName || 'Scrizian Engineer'} is a verified technical specialist on the Scrizians network.`,
      role: role || title || 'Full Stack Developer',
      experienceYears: Number(experienceYears) || 4,
      skills: finalSkills,
      availability: availability || 'Immediate',
      hourlyRateUSD: Number(hourlyRateUSD) || 35,
      monthlyRateINR: Number(monthlyRateINR) || 150000,
      status: status === 'Verified' || status === 'approved' ? 'approved' : 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Talent profile created successfully.',
      data: talent,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('[Admin] createTalent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create talent profile.',
      requestId: req.requestId
    });
  }
};

exports.adminUpdateTalent = async (req, res) => {
  try {
    const { id } = req.params;
    let talent = await TalentProfile.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { scrizianId: id.toUpperCase() }]
    });

    if (!talent) {
      return res.status(404).json({
        success: false,
        message: 'Talent profile not found.',
        requestId: req.requestId
      });
    }

    const {
      displayName,
      title,
      summary,
      role,
      experienceYears,
      skills,
      availability,
      hourlyRateUSD,
      monthlyRateINR,
      status
    } = req.body;

    if (displayName) talent.displayName = displayName;
    if (title) talent.title = title;
    if (summary) talent.summary = summary;
    if (role) talent.role = role;
    if (experienceYears !== undefined) talent.experienceYears = Number(experienceYears);
    if (availability) talent.availability = availability;
    if (hourlyRateUSD !== undefined) talent.hourlyRateUSD = Number(hourlyRateUSD);
    if (status) {
      if (status === 'Verified' || status === 'approved' || status === 'verified') {
        talent.status = 'approved';
        talent.verificationStatus = 'verified';
        talent.relationshipBadge = req.body.relationshipBadge || 'Verified Scrizian';
      } else if (status === 'Pending Review' || status === 'pending') {
        talent.status = 'pending';
        talent.verificationStatus = 'pending';
        talent.relationshipBadge = req.body.relationshipBadge || 'Available for Hire';
      } else if (status === 'In Review' || status === 'in_review' || status === 'under_review') {
        talent.status = 'in_review';
        talent.verificationStatus = 'under_review';
      } else if (status === 'Changes Requested' || status === 'changes_requested') {
        talent.status = 'changes_requested';
        talent.verificationStatus = 'changes_requested';
      } else if (status === 'Rejected' || status === 'rejected') {
        talent.status = 'rejected';
        talent.verificationStatus = 'rejected';
      } else {
        const normalized = status.toLowerCase().replace(/\s+/g, '_');
        talent.status = ['approved', 'pending', 'rejected', 'suspended', 'draft', 'changes_requested', 'under_review', 'in_review', 'verified'].includes(normalized) ? normalized : 'pending';
      }
    }
    if (req.body.verificationStatus) {
      talent.verificationStatus = req.body.verificationStatus.toLowerCase();
    }
    if (req.body.relationshipBadge) {
      talent.relationshipBadge = req.body.relationshipBadge;
    }

    if (skills !== undefined) {
      let rawSkills = skills;
      if (typeof rawSkills === 'string') {
        talent.skills = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(rawSkills)) {
        talent.skills = rawSkills.filter(s => typeof s === 'string' && s.trim());
      }
    }

    await talent.save();

    return res.status(200).json({
      success: true,
      message: 'Talent profile updated successfully.',
      data: talent,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('[Admin] updateTalent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update talent profile.',
      requestId: req.requestId
    });
  }
};

exports.adminDeleteTalent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await TalentProfile.deleteOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { scrizianId: id.toUpperCase() }]
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Talent profile not found or already deleted.',
        requestId: req.requestId
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Talent profile deleted successfully.',
      requestId: req.requestId
    });
  } catch (error) {
    console.error('[Admin] deleteTalent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete talent profile.',
      requestId: req.requestId
    });
  }
};