const Portfolio = require('../models/Portfolio');
const TalentProfile = require('../models/TalentProfile');

const normalize = (value) =>
  typeof value === 'string' ? value.trim() : value;

const makeSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/*
 * Get the TalentProfile belonging to the
 * currently authenticated Scrizian.
 *
 * TalentProfile is linked using scrizianId,
 * NOT users._id.
 */
const getTalent = async (req) => {
  const scrizianId = req.user?.scrizianId;

  if (!scrizianId) {
    return null;
  }

  return TalentProfile.findOne({
    scrizianId: scrizianId.toUpperCase(),
    deletedAt: null
  });
};

/*
 * CREATE PORTFOLIO
 */
exports.createPortfolio = async (req, res) => {
  try {
    let talent = await getTalent(req);

    if (!talent && (req.user.role === 'admin' || req.user.role === 'scriza_staff')) {
      const scrizianId = (req.body.scrizianId && /^(SCR-\d+|SZN-[A-Z]+-\d+|[A-Z0-9-]+)$/i.test(req.body.scrizianId)) ? req.body.scrizianId.toUpperCase() : 'SCR-8841';
      talent = await TalentProfile.findOne({ scrizianId });
      if (!talent) {
        talent = await TalentProfile.findOne();
      }
      if (!talent) {
        talent = await TalentProfile.create({
          user: req.user.id,
          scrizianId: scrizianId,
          displayName: req.user.name || 'Scriza Lead Architect',
          title: req.body.authorRole || 'Lead Solutions Architect',
          summary: 'Experienced Full-Stack Architect & Engineering Specialist.',
          role: 'Full Stack Developer',
          experienceYears: 5,
          hourlyRateUSD: 50,
          availability: 'Immediate',
          skills: ['Next.js', 'Node.js', 'AWS'],
          status: 'Verified'
        });
      }
    }

    if (!talent) {
      return res.status(404).json({
        success: false,
        message: 'Talent profile not found.',
        requestId: req.requestId
      });
    }

    const {
      title,
      industry,
      projectType,
      summary,
      description,
      role,
      authorRole,
      skills,
      techStack,
      media,
      coverImageUrl,
      duration,
      outcome,
      clientName,
      clientNamePermission,
      liveUrl,
      repositoryUrl,
      ndaProtected,
      isNdaProtected
    } = req.body;

    const finalTitle = title || 'Untitled Project Showcase';
    const finalSummary = summary || description || finalTitle;
    const finalIndustry = industry || 'SaaS Development';
    const finalProjectType = projectType || 'Full-Stack Architecture';
    const finalRole = role || authorRole || 'Lead Architect';
    
    let rawSkills = techStack || skills;
    let finalTechStack = [];
    if (typeof rawSkills === 'string') {
      finalTechStack = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(rawSkills)) {
      finalTechStack = rawSkills.filter(s => typeof s === 'string' && s.trim());
    }

    const portfolio = await Portfolio.create({
      talent: talent._id,
      title: normalize(finalTitle),
      slug: makeSlug(`${finalTitle}-${Date.now()}`),
      industry: normalize(finalIndustry),
      projectType: normalize(finalProjectType),
      summary: normalize(finalSummary),
      role: normalize(finalRole),
      techStack: finalTechStack,
      media: Array.isArray(media) ? media : (coverImageUrl ? [{ url: coverImageUrl, type: 'image' }] : []),
      duration: normalize(duration || '12 wks'),
      outcome: normalize(outcome || 'Successfully deployed'),
      clientName: clientNamePermission ? normalize(clientName) : undefined,
      clientNamePermission: Boolean(clientNamePermission),
      liveUrl: normalize(liveUrl),
      repositoryUrl: normalize(repositoryUrl),
      ndaProtected: Boolean(ndaProtected || isNdaProtected),
      status: req.user.role === 'admin' ? 'Approved' : 'PendingReview'
    });

    return res.status(201).json({
      success: true,
      message:
        'Portfolio project created.',
      data: portfolio,
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      'createPortfolio:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to create portfolio project.',
      requestId: req.requestId
    });
  }
};

/*
 * GET MY PORTFOLIOS
 */
exports.getMyPortfolios = async (
  req,
  res
) => {
  try {
    const talent = await getTalent(req);

    if (!talent) {
      return res.status(404).json({
        success: false,
        message:
          'Talent profile not found. Create your talent profile first.',
        requestId: req.requestId
      });
    }
console.log('PORTFOLIO DEBUG:', {
  scrizianId: req.user?.scrizianId,
  talentId: talent?._id
});
    const portfolios =
      await Portfolio.find({
        talent: talent._id,
        deletedAt: null
      }).sort({
        createdAt: -1
      });
      console.log('PORTFOLIOS FOUND:', portfolios.length);

    return res.status(200).json({
      success: true,
      data: portfolios,
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      'getMyPortfolios:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to fetch portfolios.',
      requestId: req.requestId
    });
  }
};

/*
 * GET PUBLIC PORTFOLIOS
 */
exports.getPublicPortfolios = async (
  req,
  res
) => {
  try {
    const portfolios =
      await Portfolio.find({
        status: 'Approved',
        deletedAt: null
      })
        .populate({
          path: 'talent',
          select:
            'scrizianId displayName title role experienceYears skills availability relationshipBadge'
        })
        .sort({
          createdAt: -1
        });

    const data =
      portfolios.map((item) => ({
        id: item._id,

        title: item.title,

        slug: item.slug,

        industry:
          item.industry,

        projectType:
          item.projectType,

        summary:
          item.summary,

        role:
          item.role,

        techStack:
          item.techStack,

        media:
          Array.isArray(item.media)
            ? item.media.filter(
                (m) => m && m.url && m.approved !== false
              )
            : [],

        duration:
          item.duration,

        outcome:
          item.outcome,

        clientName:
          item.clientNamePermission
            ? item.clientName
            : item.ndaProtected
              ? 'Confidential Client'
              : undefined,

        liveUrl:
          item.publicLinksApproved
            ? item.liveUrl
            : undefined,

        repositoryUrl:
          item.publicLinksApproved
            ? item.repositoryUrl
            : undefined,

        seo:
          item.seo,

        talent:
          item.talent
      }));

    return res.status(200).json({
      success: true,
      data,
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      'getPublicPortfolios:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to fetch portfolios.',
      requestId: req.requestId
    });
  }
};

/*
 * GET PORTFOLIO BY SLUG
 */
exports.getPortfolioBySlug = async (
  req,
  res
) => {
  try {
    const mongoose = require('mongoose');
    const slug = req.params.slug;
    const query = {
      status: 'Approved',
      deletedAt: null,
      $or: [{ slug: slug.toLowerCase() }]
    };

    if (mongoose.Types.ObjectId.isValid(slug)) {
      query.$or.push({ _id: slug });
    }

    const portfolio =
      await Portfolio.findOne(query).populate({
        path: 'talent',
        select:
          'scrizianId displayName title role experienceYears skills availability relationshipBadge'
      });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message:
          'Portfolio not found.',
        requestId: req.requestId
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        id: portfolio._id,

        title:
          portfolio.title,

        slug:
          portfolio.slug,

        industry:
          portfolio.industry,

        projectType:
          portfolio.projectType,

        summary:
          portfolio.summary,

        role:
          portfolio.role,

        techStack:
          portfolio.techStack,

        media:
          Array.isArray(portfolio.media)
            ? portfolio.media.filter(
                (m) => m && m.url && m.approved !== false
              )
            : [],

        duration:
          portfolio.duration,

        outcome:
          portfolio.outcome,

        clientName:
          portfolio.clientNamePermission
            ? portfolio.clientName
            : portfolio.ndaProtected
              ? 'Confidential Client'
              : undefined,

        liveUrl:
          portfolio.publicLinksApproved
            ? portfolio.liveUrl
            : undefined,

        repositoryUrl:
          portfolio.publicLinksApproved
            ? portfolio.repositoryUrl
            : undefined,

        seo:
          portfolio.seo,

        talent:
          portfolio.talent
      },

      requestId:
        req.requestId
    });
  } catch (error) {
    console.error(
      'getPortfolioBySlug:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to fetch portfolio.',
      requestId: req.requestId
    });
  }
};

/*
 * UPDATE PORTFOLIO
 */
exports.updatePortfolio = async (
  req,
  res
) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'scriza_staff';

    const idQuery = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }] }
      : { slug: id };

    let portfolio;
    if (isAdmin) {
      portfolio = await Portfolio.findOne({ ...idQuery, deletedAt: null });
    } else {
      const talent = await getTalent(req);
      if (!talent) {
        return res.status(404).json({
          success: false,
          message: 'Talent profile not found. Create your talent profile first.',
          requestId: req.requestId
        });
      }
      portfolio = await Portfolio.findOne({ ...idQuery, talent: talent._id, deletedAt: null });
    }

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found.',
        requestId: req.requestId
      });
    }

    if (req.body.status) {
      portfolio.status = req.body.status;
    } else if (!isAdmin && portfolio.status === 'Approved') {
      portfolio.status = 'Submitted';
    }

    const allowedFields = [
      'title',
      'industry',
      'projectType',
      'summary',
      'role',
      'techStack',
      'media',
      'duration',
      'outcome',
      'clientName',
      'clientNamePermission',
      'liveUrl',
      'repositoryUrl',
      'ndaProtected',
      'status'
    ];

    allowedFields.forEach(
      (field) => {
        if (
          req.body[field] !==
          undefined
        ) {
          portfolio[field] =
            req.body[field];
        }
      }
    );

    await portfolio.save();

    return res.status(200).json({
      success: true,
      message:
        'Portfolio updated.',
      data: portfolio,
      requestId:
        req.requestId
    });
  } catch (error) {
    console.error(
      'updatePortfolio:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message || 'Unable to update portfolio.',
      requestId:
        req.requestId
    });
  }
};

/*
 * SUBMIT PORTFOLIO
 */
exports.submitPortfolio = async (
  req,
  res
) => {
  try {
    const talent = await getTalent(req);

    if (!talent) {
      return res.status(404).json({
        success: false,
        message:
          'Talent profile not found. Create your talent profile first.',
        requestId:
          req.requestId
      });
    }

    const portfolio =
      await Portfolio.findOne({
        _id: req.params.id,
        talent: talent._id,
        deletedAt: null
      });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message:
          'Portfolio not found.',
        requestId:
          req.requestId
      });
    }

    if (
      ![
        'Draft',
        'Changes Requested',
        'Rejected'
      ].includes(
        portfolio.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Portfolio cannot be submitted in its current state.',
        requestId:
          req.requestId
      });
    }

    portfolio.status =
      'Submitted';

    await portfolio.save();

    return res.status(200).json({
      success: true,
      message:
        'Portfolio submitted for review.',
      data: {
        id:
          portfolio._id,
        status:
          portfolio.status
      },
      requestId:
        req.requestId
    });
  } catch (error) {
    console.error(
      'submitPortfolio:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to submit portfolio.',
      requestId:
        req.requestId
    });
  }
};

/*
 * REVIEW PORTFOLIO
 */
exports.reviewPortfolio = async (
  req,
  res
) => {
  try {
    const {
      status,
      comment
    } = req.body;

    if (
      ![
        'Approved',
        'Changes Requested',
        'Rejected'
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid review status.',
        requestId:
          req.requestId
      });
    }

    const portfolio =
      await Portfolio.findOne({
        _id: req.params.id,
        deletedAt: null
      });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message:
          'Portfolio not found.',
        requestId:
          req.requestId
      });
    }

    portfolio.status =
      status;

    portfolio.reviewedBy =
      req.user.id;

    portfolio.reviewedAt =
      new Date();

    portfolio.reviewComment =
      normalize(comment);

    if (
      status === 'Approved'
    ) {
      portfolio.media =
        Array.isArray(
          portfolio.media
        )
          ? portfolio.media.map(
              (item) => ({
                ...item.toObject(),
                approved:
                  true
              })
            )
          : [];

      if (
        portfolio.liveUrl ||
        portfolio.repositoryUrl
      ) {
        portfolio.publicLinksApproved =
          true;
      }
    }

    await portfolio.save();

    return res.status(200).json({
      success: true,
      message:
        `Portfolio ${status.toLowerCase()}.`,
      data: {
        id:
          portfolio._id,
        status:
          portfolio.status
      },
      requestId:
        req.requestId
    });
  } catch (error) {
    console.error(
      'reviewPortfolio:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to review portfolio.',
      requestId:
        req.requestId
    });
  }
};

/*
 * DELETE PORTFOLIO
 */
exports.deletePortfolio = async (
  req,
  res
) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'scriza_staff';

    const idQuery = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }] }
      : { slug: id };

    let portfolio;
    if (isAdmin) {
      portfolio = await Portfolio.findOne({ ...idQuery, deletedAt: null });
    } else {
      const talent = await getTalent(req);
      if (!talent) {
        return res.status(404).json({
          success: false,
          message: 'Talent profile not found. Create your talent profile first.',
          requestId: req.requestId
        });
      }
      portfolio = await Portfolio.findOne({ ...idQuery, talent: talent._id, deletedAt: null });
    }

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found.',
        requestId: req.requestId
      });
    }

    portfolio.deletedAt =
      new Date();

    await portfolio.save();

    return res.status(200).json({
      success: true,
      message:
        'Portfolio deleted.',
      requestId:
        req.requestId
    });
  } catch (error) {
    console.error(
      'deletePortfolio:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to delete portfolio.',
      requestId:
        req.requestId
    });
  }
};