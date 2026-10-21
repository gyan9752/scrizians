const Shortlist = require('../models/Shortlist');
const Requirement = require('../models/Requirement');
const TalentProfile = require('../models/TalentProfile');

const normalizeString = (value, maxLength = 3000) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value)
    .trim()
    .slice(0, maxLength);
};

/**
 * Create shortlist
 */
exports.createShortlist = async (req, res) => {
  try {
    const {
      requirementId,
      talentId,
      notes
    } = req.body || {};

    if (!requirementId || !talentId) {
      return res.status(400).json({
        success: false,
        message:
          'Requirement ID and talent ID are required.',
        requestId: req.requestId
      });
    }

    const requirement =
      await Requirement.findOne({
        _id: requirementId,
        client: req.user.id,
        deletedAt: null
      })
        .lean()
        .maxTimeMS(5000);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message:
          'Requirement not found or access denied.',
        requestId: req.requestId
      });
    }

    if (
      ![
        'Submitted',
        'Reviewing',
        'Talent Shortlisted'
      ].includes(requirement.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Talent cannot be shortlisted at the current requirement stage.',
        requestId: req.requestId
      });
    }

    const talent =
      await TalentProfile.findOne({
        _id: talentId,
        status: 'approved',
        verificationStatus: 'verified',
        deletedAt: null
      })
        .lean()
        .maxTimeMS(5000);

    if (!talent) {
      return res.status(404).json({
        success: false,
        message: 'Approved talent not found.',
        requestId: req.requestId
      });
    }

    const existing =
      await Shortlist.findOne({
        requirement: requirementId,
        talent: talentId
      })
        .lean()
        .maxTimeMS(5000);

    if (existing && !existing.deletedAt) {
      return res.status(409).json({
        success: false,
        message:
          'Talent is already shortlisted for this requirement.',
        requestId: req.requestId
      });
    }

    const shortlist =
      existing && existing.deletedAt
        ? await Shortlist.findByIdAndUpdate(
            existing._id,
            {
              deletedAt: null,
              status: 'Shortlisted',
              notes: normalizeString(notes)
            },
            {
              new: true
            }
          )
        : await Shortlist.create({
            requirement: requirementId,
            talent: talentId,
            client: req.user.id,
            createdBy: req.user.id,
            notes: normalizeString(notes)
          });

    await Requirement.updateOne(
      {
        _id: requirementId
      },
      {
        $set: {
          status: 'Talent Shortlisted'
        }
      }
    );

    return res.status(201).json({
      success: true,
      message:
        'Talent shortlisted successfully.',
      data: {
        id: shortlist._id,
        requirement: shortlist.requirement,
        talent: shortlist.talent,
        status: shortlist.status,
        notes: shortlist.notes
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Shortlist] Create error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to shortlist talent.',
      requestId: req.requestId
    });
  }
};

/**
 * Get client's shortlists
 */
exports.getMyShortlists = async (req, res) => {
  try {
    const shortlists =
      await Shortlist.find({
        client: req.user.id,
        deletedAt: null
      })
        .populate(
          'requirement',
          'title status'
        )
        .populate(
          'talent',
          'scrizianId displayName title skills experienceYears availability relationshipBadge'
        )
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(5000);

    return res.status(200).json({
      success: true,
      data: shortlists,
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Shortlist] List error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to fetch shortlisted talents.',
      requestId: req.requestId
    });
  }
};

/**
 * Get shortlists for one requirement
 */
exports.getRequirementShortlists =
  async (req, res) => {
    try {
      const requirement =
        await Requirement.findOne({
          _id: req.params.requirementId,
          client: req.user.id,
          deletedAt: null
        })
          .lean()
          .maxTimeMS(5000);

      if (!requirement) {
        return res.status(404).json({
          success: false,
          message:
            'Requirement not found.',
          requestId: req.requestId
        });
      }

      const shortlists =
        await Shortlist.find({
          requirement: requirement._id,
          client: req.user.id,
          deletedAt: null
        })
          .populate(
            'talent',
            'scrizianId displayName title summary role skills categories experienceYears timezone region availability engagementPreference languages relationshipBadge'
          )
          .sort({ createdAt: -1 })
          .lean()
          .maxTimeMS(5000);

      return res.status(200).json({
        success: true,
        data: shortlists,
        requestId: req.requestId
      });
    } catch (error) {
      console.error(
        '[Shortlist] Requirement list error:',
        {
          requestId: req.requestId,
          message: error.message
        }
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to fetch requirement shortlists.',
        requestId: req.requestId
      });
    }
  };

/**
 * Update shortlist status
 */
exports.updateShortlistStatus =
  async (req, res) => {
    try {
      const allowedStatuses = [
        'Shortlisted',
        'Interview',
        'Selected',
        'Rejected',
        'Withdrawn'
      ];

      const status =
        normalizeString(
          req.body?.status,
          50
        );

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid shortlist status.',
          requestId: req.requestId
        });
      }

      const shortlist =
        await Shortlist.findOne({
          _id: req.params.id,
          client: req.user.id,
          deletedAt: null
        });

      if (!shortlist) {
        return res.status(404).json({
          success: false,
          message:
            'Shortlist record not found.',
          requestId: req.requestId
        });
      }

      shortlist.status = status;

      if (req.body?.notes !== undefined) {
        shortlist.notes =
          normalizeString(req.body.notes);
      }

      await shortlist.save();

      if (status === 'Interview') {
        await Requirement.updateOne(
          {
            _id: shortlist.requirement,
            client: req.user.id
          },
          {
            $set: {
              status: 'Interview'
            }
          }
        );
      }

      if (status === 'Selected') {
        await Requirement.updateOne(
          {
            _id: shortlist.requirement,
            client: req.user.id
          },
          {
            $set: {
              status: 'In Progress'
            }
          }
        );
      }

      return res.status(200).json({
        success: true,
        message:
          'Shortlist status updated successfully.',
        data: {
          id: shortlist._id,
          status: shortlist.status,
          notes: shortlist.notes
        },
        requestId: req.requestId
      });
    } catch (error) {
      console.error(
        '[Shortlist] Update error:',
        {
          requestId: req.requestId,
          message: error.message
        }
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to update shortlist.',
        requestId: req.requestId
      });
    }
  };

/**
 * Remove shortlist
 */
exports.removeShortlist = async (
  req,
  res
) => {
  try {
    const shortlist =
      await Shortlist.findOne({
        _id: req.params.id,
        client: req.user.id,
        deletedAt: null
      });

    if (!shortlist) {
      return res.status(404).json({
        success: false,
        message:
          'Shortlist record not found.',
        requestId: req.requestId
      });
    }

    shortlist.deletedAt = new Date();
    shortlist.status = 'Withdrawn';

    await shortlist.save();

    return res.status(200).json({
      success: true,
      message:
        'Talent removed from shortlist.',
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Shortlist] Delete error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to remove shortlist.',
      requestId: req.requestId
    });
  }
};