const InterviewRequest = require('../models/InterviewRequest');
const Shortlist = require('../models/Shortlist');
const Requirement = require('../models/Requirement');

const normalizeString = (value, maxLength = 3000) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value)
    .trim()
    .slice(0, maxLength);
};

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

/**
 * Create interview request
 */
exports.createInterviewRequest = async (req, res) => {
  try {
    const {
      shortlistId,
      scheduledAt,
      timezone,
      meetingLink,
      message
    } = req.body || {};

    if (!shortlistId) {
      return res.status(400).json({
        success: false,
        message: 'Shortlist ID is required.',
        requestId: req.requestId
      });
    }

    const shortlist = await Shortlist.findOne({
      _id: shortlistId,
      client: req.user.id,
      deletedAt: null
    })
      .lean()
      .maxTimeMS(5000);

    if (!shortlist) {
      return res.status(404).json({
        success: false,
        message: 'Shortlist record not found.',
        requestId: req.requestId
      });
    }

    if (
      !['Shortlisted', 'Interview'].includes(
        shortlist.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Interview cannot be requested at the current shortlist stage.',
        requestId: req.requestId
      });
    }

    const requirement = await Requirement.findOne({
      _id: shortlist.requirement,
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

    const interviewDate = parseDate(scheduledAt);

    if (scheduledAt && !interviewDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interview date.',
        requestId: req.requestId
      });
    }

    if (
      interviewDate &&
      interviewDate <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Interview time must be in the future.',
        requestId: req.requestId
      });
    }

    const existing =
      await InterviewRequest.findOne({
        shortlist: shortlistId,
        client: req.user.id,
        status: {
          $in: ['Requested', 'Confirmed', 'Rescheduled']
        },
        deletedAt: null
      })
        .lean()
        .maxTimeMS(5000);

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          'An active interview request already exists for this shortlist.',
        requestId: req.requestId
      });
    }

    const interview =
      await InterviewRequest.create({
        requirement: shortlist.requirement,
        shortlist: shortlist._id,
        talent: shortlist.talent,
        client: req.user.id,
        scheduledAt: interviewDate,
        timezone:
          normalizeString(
            timezone,
            100
          ) || 'Asia/Kolkata',
        meetingLink:
          normalizeString(
            meetingLink,
            1000
          ) || null,
        message: normalizeString(
          message,
          3000
        ),
        createdBy: req.user.id,
        status: 'Requested'
      });

    await Shortlist.updateOne(
      {
        _id: shortlist._id
      },
      {
        $set: {
          status: 'Interview'
        }
      }
    );

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

    return res.status(201).json({
      success: true,
      message:
        'Interview request created successfully.',
      data: {
        id: interview._id,
        requirement: interview.requirement,
        shortlist: interview.shortlist,
        talent: interview.talent,
        scheduledAt: interview.scheduledAt,
        timezone: interview.timezone,
        status: interview.status
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Interview] Create error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to create interview request.',
      requestId: req.requestId
    });
  }
};

/**
 * Get client's interview requests
 */
exports.getMyInterviewRequests = async (
  req,
  res
) => {
  try {
    const interviews =
      await InterviewRequest.find({
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
      data: interviews,
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Interview] List error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to fetch interview requests.',
      requestId: req.requestId
    });
  }
};

/**
 * Update interview status
 */
exports.updateInterviewStatus = async (
  req,
  res
) => {
  try {
    const allowedStatuses = [
      'Requested',
      'Confirmed',
      'Rescheduled',
      'Completed',
      'Cancelled',
      'Rejected'
    ];

    const status = normalizeString(
      req.body?.status,
      50
    );

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interview status.',
        requestId: req.requestId
      });
    }

    const interview =
      await InterviewRequest.findOne({
        _id: req.params.id,
        client: req.user.id,
        deletedAt: null
      });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message:
          'Interview request not found.',
        requestId: req.requestId
      });
    }

    interview.status = status;

    if (req.body?.scheduledAt !== undefined) {
      const date = parseDate(
        req.body.scheduledAt
      );

      if (
        req.body.scheduledAt &&
        !date
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid interview date.',
          requestId: req.requestId
        });
      }

      interview.scheduledAt = date;
    }

    if (req.body?.meetingLink !== undefined) {
      interview.meetingLink =
        normalizeString(
          req.body.meetingLink,
          1000
        ) || null;
    }

    await interview.save();

    if (status === 'Confirmed') {
      await Shortlist.updateOne(
        { _id: interview.shortlist },
        { $set: { status: 'Interview' } }
      );
    }

    if (status === 'Completed') {
      await Requirement.updateOne(
        {
          _id: interview.requirement,
          client: req.user.id
        },
        {
          $set: {
            status: 'Negotiation'
          }
        }
      );
    }

    if (
      ['Cancelled', 'Rejected'].includes(status)
    ) {
      await Shortlist.updateOne(
        { _id: interview.shortlist },
        { $set: { status: 'Rejected' } }
      );
    }

    return res.status(200).json({
      success: true,
      message:
        'Interview status updated successfully.',
      data: {
        id: interview._id,
        status: interview.status,
        scheduledAt:
          interview.scheduledAt,
        meetingLink:
          interview.meetingLink
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Interview] Update error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to update interview request.',
      requestId: req.requestId
    });
  }
};

/**
 * Delete/cancel interview request
 */
exports.deleteInterviewRequest = async (
  req,
  res
) => {
  try {
    const interview =
      await InterviewRequest.findOne({
        _id: req.params.id,
        client: req.user.id,
        deletedAt: null
      });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message:
          'Interview request not found.',
        requestId: req.requestId
      });
    }

    interview.deletedAt = new Date();
    interview.status = 'Cancelled';

    await interview.save();

    return res.status(200).json({
      success: true,
      message:
        'Interview request cancelled successfully.',
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Interview] Delete error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to cancel interview request.',
      requestId: req.requestId
    });
  }
};