const Engagement = require('../models/Engagement');
const Requirement = require('../models/Requirement');
const TalentProfile = require('../models/TalentProfile');

exports.createEngagement = async (req, res) => {
  try {
    const {
      requirement,
      talent,
      shortlist,
      startDate,
      endDate,
      commercialSummary,
      notes
    } = req.body;

    if (!requirement || !talent || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Requirement, talent and start date are required.',
        requestId: req.requestId
      });
    }

    const reqDoc = await Requirement.findOne({
      _id: requirement,
      client: req.user.id,
      deletedAt: null
    });

    if (!reqDoc) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found.',
        requestId: req.requestId
      });
    }

    const talentDoc = await TalentProfile.findOne({
      _id: talent,
      verificationStatus: 'verified',
      status: 'approved',
      deletedAt: null
    });

    if (!talentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Approved talent not found.',
        requestId: req.requestId
      });
    }

    const existing = await Engagement.findOne({
      requirement,
      talent,
      status: {
        $in: ['Pending', 'Active', 'Paused']
      },
      deletedAt: null
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Active engagement already exists.',
        requestId: req.requestId
      });
    }

    const engagement = await Engagement.create({
      client: req.user.id,
      requirement,
      talent,
      shortlist,
      startDate,
      endDate,
      commercialSummary,
      notes,
      status: 'Pending',
      createdBy: req.user.id
    });

    reqDoc.status = 'In Progress';
    await reqDoc.save();

    return res.status(201).json({
      success: true,
      message: 'Engagement created.',
      data: engagement,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('createEngagement:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to create engagement.',
      requestId: req.requestId
    });
  }
};

exports.getMyEngagements = async (req, res) => {
  try {
    const engagements = await Engagement.find({
      client: req.user.id,
      deletedAt: null
    })
      .populate(
        'talent',
        'scrizianId displayName title role experienceYears skills relationshipBadge'
      )
      .populate(
        'requirement',
        'title status skills engagementType'
      )
      .populate(
        'company',
        'name country website status'
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: engagements,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch engagements.',
      requestId: req.requestId
    });
  }
};

exports.getEngagementById = async (req, res) => {
  try {
    const engagement = await Engagement.findOne({
      _id: req.params.id,
      client: req.user.id,
      deletedAt: null
    })
      .populate(
        'talent',
        'scrizianId displayName title role experienceYears skills relationshipBadge'
      )
      .populate('requirement')
      .populate('company');

    if (!engagement) {
      return res.status(404).json({
        success: false,
        message: 'Engagement not found.',
        requestId: req.requestId
      });
    }

    return res.status(200).json({
      success: true,
      data: engagement,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch engagement.',
      requestId: req.requestId
    });
  }
};

exports.updateEngagementStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = [
      'Pending',
      'Active',
      'Paused',
      'Completed',
      'Cancelled'
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid engagement status.',
        requestId: req.requestId
      });
    }

    const engagement = await Engagement.findOne({
      _id: req.params.id,
      client: req.user.id,
      deletedAt: null
    });

    if (!engagement) {
      return res.status(404).json({
        success: false,
        message: 'Engagement not found.',
        requestId: req.requestId
      });
    }

    engagement.status = status;

    if (req.body.endDate !== undefined) {
      engagement.endDate = req.body.endDate;
    }

    if (req.body.notes !== undefined) {
      engagement.notes = req.body.notes;
    }

    await engagement.save();

    if (status === 'Completed' || status === 'Cancelled') {
      await Requirement.findByIdAndUpdate(
        engagement.requirement,
        {
          $set: {
            status: status === 'Completed'
              ? 'Completed'
              : 'Cancelled'
          }
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Engagement status updated.',
      data: {
        id: engagement._id,
        status: engagement.status
      },
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to update engagement.',
      requestId: req.requestId
    });
  }
};

exports.deleteEngagement = async (req, res) => {
  try {
    const engagement = await Engagement.findOne({
      _id: req.params.id,
      client: req.user.id,
      deletedAt: null
    });

    if (!engagement) {
      return res.status(404).json({
        success: false,
        message: 'Engagement not found.',
        requestId: req.requestId
      });
    }

    engagement.deletedAt = new Date();
    engagement.status = 'Cancelled';

    await engagement.save();

    return res.status(200).json({
      success: true,
      message: 'Engagement cancelled.',
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to cancel engagement.',
      requestId: req.requestId
    });
  }
};