const Lead = require('../models/Lead');
const emailService = require('../services/emailService');
const cacheService = require('../services/cacheService');

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

const normalizeString = (value, maxLength = 500) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
};

const normalizeEmail = (value) => {
  const email = normalizeString(value, 254);

  if (!email) {
    return null;
  }

  return email.toLowerCase();
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const getClientIp = (req) => {
  const forwardedFor =
    req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string') {
    return forwardedFor
      .split(',')[0]
      .trim()
      .slice(0, 100);
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

const getRequestSource = (req) => {
  const bodySource = normalizeString(
    req.body?.source,
    100
  );

  const bodyUtmSource = normalizeString(
    req.body?.utmSource,
    100
  );

  const bodyUtmMedium = normalizeString(
    req.body?.utmMedium,
    100
  );

  const bodyUtmCampaign = normalizeString(
    req.body?.utmCampaign,
    150
  );

  const bodyUtmTerm = normalizeString(
    req.body?.utmTerm,
    150
  );

  const bodyUtmContent = normalizeString(
    req.body?.utmContent,
    150
  );

  const referrer = normalizeString(
    req.headers.referer ||
      req.headers.referrer,
    1000
  );

  return {
    source: bodySource || 'website',
    utmSource:
      bodyUtmSource || 'direct',
    utmMedium: bodyUtmMedium || null,
    utmCampaign: bodyUtmCampaign || null,
    utmTerm: bodyUtmTerm || null,
    utmContent: bodyUtmContent || null,
    referrer: referrer || null
  };
};

exports.submitLead = async (req, res) => {
  try {
    const clientIp = getClientIp(req);

    /*
     * Public lead submission is intentionally rate limited.
     *
     * 5 submissions per minute per IP prevents
     * accidental loops and basic spam abuse.
     */
    const rateCheck =
      cacheService.checkRateLimit(
        `lead:${clientIp}`,
        5,
        60000
      );

    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        message:
          `Too many submissions. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        requestId:
          req.requestId
      });
    }

    /*
     * Honeypot field.
     *
     * Frontend can keep this field hidden from normal
     * users. Bots filling it are silently rejected.
     */
    const honeypot =
      normalizeString(
        req.body?.website,
        200
      );

    if (honeypot) {
      return res.status(400).json({
        success: false,
        message:
          'Unable to process the request.',
        requestId:
          req.requestId
      });
    }

    const name = normalizeString(
      req.body?.name,
      100
    );

    const email = normalizeEmail(
      req.body?.email
    );

    const phone = normalizeString(
      req.body?.phone,
      30
    );

    const company = normalizeString(
      req.body?.company,
      150
    );

    const serviceRequested =
      normalizeString(
        req.body?.serviceRequested,
        150
      );

    const message = normalizeString(
      req.body?.message,
      5000
    );

    const scrizianIdReferenced =
      normalizeString(
        req.body?.scrizianIdReferenced,
        30
      );

    if (
      !name ||
      !email ||
      (!serviceRequested && !message)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email and either service requested or message are required.',
        requestId:
          req.requestId
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide a valid email address.',
        requestId:
          req.requestId
      });
    }

    /*
     * Validate Scrizian ID when a lead references
     * a specific public talent profile.
     */
    if (
      scrizianIdReferenced &&
      !/^(SCR-\d+|SZN-[A-Z]+-\d+|[A-Z0-9-]+)$/i.test(
        scrizianIdReferenced
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid Scrizian ID format.',
        requestId:
          req.requestId
      });
    }

    const sourceData =
      getRequestSource(req);

    /*
     * Basic duplicate protection.
     *
     * Prevents the same email from creating multiple
     * leads within a short window.
     *
     * This is intentionally a soft check because the
     * same client may legitimately submit another
     * requirement later.
     */
    const recentDuplicate =
      await Lead.findOne({
        email,
        createdAt: {
          $gte:
            new Date(
              Date.now() -
                10 * 60 * 1000
            )
        }
      })
        .select('_id createdAt')
        .lean();

    if (recentDuplicate) {
      return res.status(409).json({
        success: false,
        message:
          'A recent enquiry from this email address is already being processed.',
        requestId:
          req.requestId
      });
    }

    const newLead = await Lead.create({
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,

      serviceRequested:
        serviceRequested ||
        'General Enquiry',

      message:
        message ||
        'Inbound contact request',

      scrizianIdReferenced:
        scrizianIdReferenced
          ? scrizianIdReferenced.toUpperCase()
          : undefined,

      source:
        sourceData.source,

      utmSource:
        sourceData.utmSource,

      utmMedium:
        sourceData.utmMedium,

      utmCampaign:
        sourceData.utmCampaign,

      utmTerm:
        sourceData.utmTerm,

      utmContent:
        sourceData.utmContent,

      referrer:
        sourceData.referrer,

      ipAddress:
        clientIp,

      userAgent:
        normalizeString(
          req.headers['user-agent'],
          1000
        )
    });

    /*
     * Send notification after successful persistence.
     *
     * Lead creation should remain successful even if
     * the notification service temporarily fails.
     */
    try {
      await emailService.sendLeadAlertNotification(
        newLead
      );
    } catch (emailError) {
      console.error(
        '[Lead] Email notification failed:',
        {
          requestId:
            req.requestId,
          leadId:
            newLead._id.toString(),
          message:
            emailError.message
        }
      );
    }

    /*
     * Clear cached lead listing after creating
     * a new lead.
     */
    if (
      typeof cacheService.delete ===
      'function'
    ) {
      cacheService.delete(
        'all_leads'
      );
    } else if (
      typeof cacheService.del ===
      'function'
    ) {
      cacheService.del(
        'all_leads'
      );
    }

    return res.status(201).json({
      success: true,
      message:
        'Thank you for reaching out to Scrizians! Our talent curation team (+91 91191 12999) will contact you shortly.',
      leadId:
        newLead._id,
      requestId:
        req.requestId
    });
  } catch (error) {
    console.error(
      '[Lead] Submission error:',
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
        'Unable to submit your enquiry right now. Please try again later.',
      requestId:
        req.requestId
    });
  }
};

exports.getLeads = async (req, res) => {
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
      Number.isInteger(pageValue) &&
      pageValue > 0
        ? pageValue
        : 1;

    const limit =
      Number.isInteger(limitValue) &&
      limitValue > 0
        ? Math.min(
            limitValue,
            MAX_PAGE_SIZE
          )
        : DEFAULT_PAGE_SIZE;

    const skip =
      (page - 1) * limit;

    const cacheKey =
      `all_leads:${page}:${limit}`;

    const cachedLeads =
      cacheService.get(cacheKey);

    if (cachedLeads) {
      return res.status(200).json({
        success: true,
        count:
          cachedLeads.data.length,
        pagination:
          cachedLeads.pagination,
        data:
          cachedLeads.data,
        cached: true,
        requestId:
          req.requestId
      });
    }

    const [
      total,
      leads
    ] = await Promise.all([
      Lead.countDocuments(),

      Lead.find()
        .sort({
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

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage:
        page < totalPages,
      hasPreviousPage:
        page > 1
    };

    const cachePayload = {
      data: leads,
      pagination
    };

    cacheService.set(
      cacheKey,
      cachePayload,
      60
    );

    return res.status(200).json({
      success: true,
      count:
        leads.length,
      pagination,
      data:
        leads,
      requestId:
        req.requestId
    });
  } catch (error) {
    console.error(
      '[Lead] Fetch error:',
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
        'Unable to load leads.',
      requestId:
        req.requestId
    });
  }
};

/*
 * UPDATE LEAD (Admin / Staff)
 */
exports.updateLead = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Lead ID format.',
        requestId: req.requestId
      });
    }

    const { stage, notes, owner, name, phone, company, serviceRequested, message } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found.',
        requestId: req.requestId
      });
    }

    if (stage) lead.stage = stage;
    if (notes !== undefined) lead.notes = notes;
    if (owner !== undefined) lead.owner = owner;
    if (name) lead.name = name;
    if (phone !== undefined) lead.phone = phone;
    if (company !== undefined) lead.company = company;
    if (serviceRequested) lead.serviceRequested = serviceRequested;
    if (message) lead.message = message;

    await lead.save();

    try {
      if (typeof cacheService.flush === 'function') {
        cacheService.flush();
      }
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: 'Lead updated successfully.',
      data: lead,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('[Lead] Update error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to update lead.',
      requestId: req.requestId
    });
  }
};

/*
 * DELETE LEAD (Admin / Staff)
 */
exports.deleteLead = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Lead ID format.',
        requestId: req.requestId
      });
    }

    const lead = await Lead.findByIdAndDelete(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found.',
        requestId: req.requestId
      });
    }

    try {
      if (typeof cacheService.flush === 'function') {
        cacheService.flush();
      }
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: 'Lead deleted successfully.',
      requestId: req.requestId
    });
  } catch (error) {
    console.error('[Lead] Delete error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to delete lead.',
      requestId: req.requestId
    });
  }
};