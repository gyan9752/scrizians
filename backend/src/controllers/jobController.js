const Job = require('../models/Job');

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 12;

const normalizeString = (
  value,
  maxLength = 500
) => {
  if (
    typeof value !== 'string'
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized
    ? normalized.slice(
        0,
        maxLength
      )
    : null;
};

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};

const getEmploymentType = (
  type
) => {
  const normalized =
    normalizeString(
      type,
      50
    );

  if (!normalized) {
    return 'FULL_TIME';
  }

  const employmentTypes = {
    'Full-Time':
      'FULL_TIME',
    'Part-Time':
      'PART_TIME',
    Contract:
      'CONTRACTOR',
    Freelance:
      'CONTRACTOR',
    Internship:
      'INTERN',
    Temporary:
      'TEMPORARY'
  };

  return (
    employmentTypes[
      normalized
    ] || 'FULL_TIME'
  );
};

const buildJobPostingStructuredData = (
  job
) => {
  const postedAt =
  parseDate(
    job.postedAt
  ) ||
  parseDate(
    job.createdAt
  ) ||
  new Date();

  const expiresAt =
    parseDate(
      job.expiresAt
    );

  const validThrough =
    expiresAt ||
    new Date(
      Date.now() +
        90 *
          24 *
          60 *
          60 *
          1000
    );

  const structuredData = {
    '@context':
      'https://schema.org',
    '@type':
      'JobPosting',

    title:
      job.title,

    description:
      job.description,

    identifier: {
      '@type':
        'PropertyValue',
      name:
        'Scrizians / Scriza Private Limited',
      value:
        job._id.toString()
    },

    datePosted:
      postedAt.toISOString(),

    validThrough:
      validThrough.toISOString(),

    employmentType:
      getEmploymentType(
        job.type
      ),

    hiringOrganization: {
      '@type':
        'Organization',
      name:
        'Scriza Private Limited',
      sameAs:
        'https://scrizians.com',
      logo:
        'https://scrizians.com/images/scrizians-logo.png'
    },

    jobLocation: {
      '@type':
        'Place',

      address: {
        '@type':
          'PostalAddress',

        addressCountry:
          'IN'
      }
    }
  };

  /*
   * Add optional fields only when available.
   * This avoids sending empty structured-data values.
   */
  if (job.location) {
    structuredData.jobLocation.address.addressLocality =
      job.location;
  }

  if (job.city) {
    structuredData.jobLocation.address.addressLocality =
      job.city;
  }

  if (job.country) {
    structuredData.jobLocation.address.addressCountry =
      job.country;
  }

  if (job.remote === true) {
    structuredData.jobLocationType =
      'TELECOMMUTE';
  }

  if (
    job.salaryMin !== undefined &&
    job.salaryMax !== undefined
  ) {
    structuredData.baseSalary = {
      '@type':
        'MonetaryAmount',
      currency:
        job.salaryCurrency ||
        'INR',
      value: {
        '@type':
          'QuantitativeValue',
        minValue:
          job.salaryMin,
        maxValue:
          job.salaryMax,
        unitText:
          'YEAR'
      }
    };
  }

  return structuredData;
};

exports.getJobs = async (
  req,
  res
) => {
  try {
    const pageValue =
      Number.parseInt(
        req.query.page,
        10
      );

    const limitValue =
      Number.parseInt(
        req.query.limit,
        10
      );

    const page =
      Number.isInteger(
        pageValue
      ) && pageValue > 0
        ? pageValue
        : 1;

    const limit =
      Number.isInteger(
        limitValue
      ) && limitValue > 0
        ? Math.min(
            limitValue,
            MAX_PAGE_SIZE
          )
        : DEFAULT_PAGE_SIZE;

    const skip =
      (page - 1) *
      limit;

    const now =
      new Date();

    /*
     * Only active and non-expired jobs
     * are returned publicly.
     *
     * If expiresAt does not exist,
     * the job remains eligible.
     */
    const filter = {
      status: 'Active',
      $or: [
        {
          expiresAt: {
            $exists: false
          }
        },
        {
          expiresAt: null
        },
        {
          expiresAt: {
            $gt: now
          }
        }
      ]
    };

    const [
      total,
      jobs
    ] = await Promise.all([
      Job.countDocuments(
        filter
      ),

      Job.find(filter)
        .sort({
          postedAt: -1,
          createdAt: -1,
          _id: -1
        })
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(5000)
    ]);

    const totalPages =
      total > 0
        ? Math.ceil(
            total / limit
          )
        : 0;

    return res.status(200).json({
      success: true,

      count:
        jobs.length,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage:
          page < totalPages,
        hasPreviousPage:
          page > 1
      },

      data:
        jobs,

      requestId:
        req.requestId
    });
  } catch (error) {
    console.error(
      '[Jobs] Public listing error:',
      {
        requestId:
          req.requestId,
        message:
          error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to load job postings.',
      requestId:
        req.requestId
    });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const JobApplication = require('../models/JobApplication');
    const applications = await JobApplication.find({
      candidate: req.user.id,
      deletedAt: null
    })
      .populate('job', 'title company location rate type department slug')
      .sort({ appliedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: applications,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('[Jobs] getMyApplications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch your applications.',
      requestId: req.requestId
    });
  }
};

exports.getJobBySlug = async (
  req,
  res
) => {
  try {
    const mongoose = require('mongoose');
    const slug =
      normalizeString(
        req.params.slug,
        200
      );

    if (!slug) {
      return res.status(400).json({
        success: false,
        message:
          'Job slug is required.',
        requestId:
          req.requestId
      });
    }

    const query = {
      status: 'Active',
      $or: [
        { slug: slug.toLowerCase() },
        { id: slug }
      ]
    };

    if (mongoose.Types.ObjectId.isValid(slug)) {
      query.$or.push({ _id: slug });
    }

    const job =
      await Job.findOne(query)
        .lean()
        .maxTimeMS(5000);

    if (!job) {
      return res.status(404).json({
        success: false,
        message:
          'Job posting not found.',
        requestId:
          req.requestId
      });
    }

    /*
     * Do not expose expired jobs publicly.
     */
    if (
      job.expiresAt &&
      new Date(job.expiresAt) <=
        new Date()
    ) {
      return res.status(404).json({
        success: false,
        message:
          'Job posting is no longer available.',
        requestId:
          req.requestId
      });
    }

    const structuredData =
      buildJobPostingStructuredData(
        job
      );

    return res.status(200).json({
      success: true,

      data:
        job,

      structuredData,

      requestId:
        req.requestId
    });
  } catch (error) {
    console.error(
      '[Jobs] Job detail error:',
      {
        requestId:
          req.requestId,
        slug:
          req.params.slug,
        message:
          error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to load the job posting.',
      requestId:
        req.requestId
    });
  }
};


exports.applyForJob = async (
  req,
  res
) => {
  try {
    const JobApplication = require('../models/JobApplication');

    const slug = normalizeString(
      req.params.slug,
      200
    );

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Job slug is required.',
        requestId: req.requestId
      });
    }

    const job = await Job.findOne({
      slug,
      status: 'Active'
    })
      .lean()
      .maxTimeMS(5000);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found.',
        requestId: req.requestId
      });
    }

    if (
      job.expiresAt &&
      new Date(job.expiresAt) <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Job posting is no longer available.',
        requestId: req.requestId
      });
    }

    const coverLetter = normalizeString(
      req.body?.coverLetter,
      5000
    );

    const resume = normalizeString(
      req.body?.resume,
      1000
    );

    const existingApplication =
      await JobApplication.findOne({
        job: job._id,
        candidate: req.user.id,
        deletedAt: null
      })
        .lean()
        .maxTimeMS(5000);

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this job.',
        requestId: req.requestId
      });
    }

    const application =
      await JobApplication.create({
        job: job._id,
        jobSlug: job.slug,
        candidate: req.user.id,
        candidateScrizianId:
          req.user.scrizianId || null,
        coverLetter,
        resume
      });

    await Job.updateOne(
      { _id: job._id },
      {
        $inc: {
          applicantsCount: 1
        }
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Job application submitted successfully.',
      data: {
        id: application._id,
        jobSlug: application.jobSlug,
        status: application.status,
        appliedAt: application.appliedAt
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Jobs] Job application error:',
      {
        requestId: req.requestId,
        slug: req.params.slug,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message: 'Unable to submit job application.',
      requestId: req.requestId
    });
  }
};

exports.createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      companyLogoUrl,
      location,
      type,
      category,
      department,
      experienceLevel,
      description,
      requirements,
      salaryMin,
      salaryMax,
      salaryCurrency,
      rate,
      status
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Job title is required.'
      });
    }

    let slug = (title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await Job.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const jobType = ['Full-Time', 'Part-Time', 'Contract'].includes(type) ? type : 'Full-Time';
    const jobDescription = (description && description.trim().length >= 20)
      ? description.trim()
      : `${title.trim()} position at ${company || 'Scriza Client Partner'}. Join our high-performing team to work on cutting-edge software products.`;

    const job = await Job.create({
      id: req.body.id || `job-${Date.now()}`,
      title: title.trim(),
      slug,
      department: department || category || 'Engineering',
      experienceLevel: experienceLevel || 'Mid-Senior Level',
      company: (company || 'Scriza Client Partner').trim(),
      companyLogoUrl: companyLogoUrl || '/images/logo.png',
      location: (location || 'Remote (India / Global)').trim(),
      type: jobType,
      category: category || 'Engineering',
      description: jobDescription,
      requirements: Array.isArray(requirements) ? requirements : [],
      salaryMin: salaryMin || 0,
      salaryMax: salaryMax || 0,
      salaryCurrency: salaryCurrency || 'USD',
      rate: rate || '$30 - $40 / hr',
      status: status || 'Active',
      postedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Job opening created successfully.',
      data: job
    });
  } catch (error) {
    console.error('[Jobs] Create error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to create job posting.'
    });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;
    const updateData = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }, { id: id }] }
      : { $or: [{ slug: id }, { id: id }] };

    const job = await Job.findOne(query);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found.'
      });
    }

    Object.assign(job, updateData);
    await job.save();

    return res.status(200).json({
      success: true,
      message: 'Job posting updated successfully.',
      data: job
    });
  } catch (error) {
    console.error('[Jobs] Update error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to update job posting.'
    });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }, { id: id }] }
      : { $or: [{ slug: id }, { id: id }] };

    const job = await Job.findOneAndDelete(query);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job posting deleted successfully.'
    });
  } catch (error) {
    console.error('[Jobs] Delete error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to delete job posting.'
    });
  }
};

/*
 * Candidate: Withdraw an application
 */
exports.withdrawApplication = async (req, res) => {
  try {
    const JobApplication = require('../models/JobApplication');
    const { id } = req.params;

    const application = await JobApplication.findOne({
      _id: id,
      candidate: req.user.id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found.'
      });
    }

    application.status = 'Withdrawn';
    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully.',
      data: application
    });
  } catch (error) {
    console.error('[JobApplication] Withdraw error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to withdraw application.'
    });
  }
};

/*
 * Admin / Staff: Get all applications across jobs
 */
exports.adminGetApplications = async (req, res) => {
  try {
    const JobApplication = require('../models/JobApplication');
    const { status, jobSlug } = req.query;

    const query = {};
    if (status) query.status = status;
    if (jobSlug) query.jobSlug = jobSlug;

    const applications = await JobApplication.find(query)
      .populate('job', 'title company location type')
      .populate('candidate', 'name email phone avatar scrizianId')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('[JobApplication] Admin fetch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to load applications.'
    });
  }
};

/*
 * Admin / Staff: Update candidate application status in hiring pipeline
 */
exports.adminUpdateApplicationStatus = async (req, res) => {
  try {
    const JobApplication = require('../models/JobApplication');
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'Applied',
      'Screening',
      'Shortlisted',
      'Interview',
      'Interview Scheduled',
      'Selected',
      'Offered',
      'Joined',
      'Rejected',
      'Withdrawn'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({
      success: true,
      message: `Application moved to ${status}.`,
      data: application
    });
  } catch (error) {
    console.error('[JobApplication] Admin update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update application status.'
    });
  }
};