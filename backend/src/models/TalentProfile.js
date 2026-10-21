const mongoose = require('mongoose');

const talentProfileSchema = new mongoose.Schema(
  {
    /*
     * Stable public Scrizian identifier.
     *
     * Example:
     * SZN-DEV-00001
     */
    scrizianId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
      match: [
        /^(SCR-\d+|SZN-[A-Z]+-\d+|[A-Z0-9-]+)$/i,
        'Invalid Scrizian ID format.'
      ]
    },

    /*
     * Public display name.
     */
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },

    /*
     * Public professional title.
     */
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    /*
     * Public professional summary.
     */
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    /*
     * Primary professional role.
     */
    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },

    /*
     * Total professional experience.
     */
    experienceYears: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
      index: true
    },

    /*
     * Skill list displayed in the public talent directory.
     */
    skills: {
      type: [String],
      default: []
    },

    /*
     * Public technology/category classification.
     */
    categories: {
      type: [String],
      default: []
    },

    /*
     * Public timezone information.
     */
    timezone: {
      type: String,
      default: 'IST (UTC+5:30)',
      trim: true,
      maxlength: 100,
      index: true
    },

    /*
     * Coarse public region.
     *
     * Exact residential address is never stored here.
     */
    region: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
      index: true
    },

    /*
     * Availability shown publicly.
     */
    availability: {
      type: String,
      enum: [
        'Immediate',
        '1-2 Weeks',
        '1 Month',
        'Unavailable'
      ],
      default: 'Immediate',
      index: true
    },

    /*
     * Preferred engagement model.
     */
    engagementPreference: {
      type: String,
      enum: [
        'Full-Time',
        'Part-Time',
        'Contract',
        'Freelance',
        'Project-Based',
        'Flexible'
      ],
      default: 'Flexible',
      index: true
    },

    /*
     * Languages that the talent can use for
     * professional communication.
     */
    languages: {
      type: [String],
      default: []
    },

    /*
     * Public relationship / verification badge.
     */
    relationshipBadge: {
      type: String,
      enum: [
        'Scriza Team Member',
        'Verified Scrizian',
        'Community Member',
        'Available for Hire'
      ],
      default: 'Verified Scrizian'
    },

    /*
     * Verification state used by the talent review workflow.
     */
    verificationStatus: {
      type: String,
      enum: [
        'pending',
        'under_review',
        'in_review',
        'verified',
        'approved',
        'changes_requested',
        'rejected'
      ],
      default: 'pending',
      index: true
    },

    /*
     * Public profile publication status.
     *
     * Only approved profiles should be returned by
     * the public talent API.
     */
    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'suspended',
        'draft',
        'changes_requested',
        'under_review',
        'in_review',
        'verified'
      ],
      default: 'pending',
      index: true
    },

    /*
     * Pricing references.
     *
     * These values are optional and should ultimately be
     * populated from admin-controlled pricing configuration.
     *
     * They are not used as a substitute for the platform's
     * central pricing configuration.
     */
    hourlyRateUSD: {
      type: Number,
      min: 0,
      default: null
    },

    monthlyRateINR: {
      type: Number,
      min: 0,
      default: null
    },

    /*
     * PRIVATE & CONFIDENTIAL FIELDS
     *
     * These fields are explicitly excluded from normal
     * MongoDB queries.
     *
     * Use .select('+privateEmail') etc. only from
     * authorized backend/admin operations when required.
     */

    privatePhone: {
      type: String,
      select: false,
      trim: true,
      maxlength: 30
    },

    privateEmail: {
      type: String,
      select: false,
      trim: true,
      lowercase: true,
      maxlength: 254
    },

    privateWhatsApp: {
      type: String,
      select: false,
      trim: true,
      maxlength: 30
    },

    privateAddress: {
      type: String,
      select: false,
      trim: true,
      maxlength: 1000
    },

    privateCountry: {
      type: String,
      select: false,
      trim: true,
      maxlength: 100
    },

    privateLinkedIn: {
      type: String,
      select: false,
      trim: true,
      maxlength: 500
    },

    privateGitHub: {
      type: String,
      select: false,
      trim: true,
      maxlength: 500
    },

    privatePersonalWebsite: {
      type: String,
      select: false,
      trim: true,
      maxlength: 500
    },

    privateResumeUrl: {
      type: String,
      select: false,
      trim: true,
      maxlength: 1000
    },

    privateExpectedCompensation: {
      type: Number,
      select: false,
      min: 0,
      default: null
    },

    /*
     * Private identity / onboarding information.
     */
    privateIdentity: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
      default: null
    },

    /*
     * Admin review information.
     */
    review: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },

      reviewedAt: {
        type: Date,
        default: null
      },

      notes: {
        type: String,
        default: null,
        maxlength: 5000,
        select: false
      }
    },

    /*
     * Soft-delete support.
     */
    deletedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

/*
 * Normalize Scrizian ID before validation.
 */
talentProfileSchema.pre(
  'validate',
  function (next) {
    if (this.scrizianId) {
      this.scrizianId =
        this.scrizianId
          .trim()
          .toUpperCase();
    }

    next();
  }
);

/*
 * Public response allowlist.
 *
 * IMPORTANT:
 * Do not return the raw MongoDB document.
 *
 * An allowlist is intentionally used instead of deleting
 * private fields from the complete object. If a new private
 * field is added to the schema in the future, it will not
 * automatically become public.
 */
talentProfileSchema.methods.toPublicJSON =
  function () {
    return {
      scrizianId: this.scrizianId,
      displayName: this.displayName,
      title: this.title,
      summary: this.summary,
      role: this.role,
      experienceYears:
        this.experienceYears,
      skills: this.skills || [],
      categories:
        this.categories || [],
      timezone: this.timezone,
      region: this.region,
      availability:
        this.availability,
      engagementPreference:
        this.engagementPreference,
      languages:
        this.languages || [],
      relationshipBadge:
        this.relationshipBadge,
      verificationStatus:
        this.verificationStatus,

      /*
       * Pricing values are included only when they have
       * actually been configured.
       */
      ...(this.hourlyRateUSD !== null &&
      this.hourlyRateUSD !== undefined
        ? {
            hourlyRateUSD:
              this.hourlyRateUSD
          }
        : {}),

      ...(this.monthlyRateINR !== null &&
      this.monthlyRateINR !== undefined
        ? {
            monthlyRateINR:
              this.monthlyRateINR
          }
        : {}),

      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

/*
 * Indexes for public directory filtering and lookup.
 */
talentProfileSchema.index({
  status: 1,
  availability: 1
});

talentProfileSchema.index({
  status: 1,
  role: 1
});

talentProfileSchema.index({
  status: 1,
  experienceYears: 1
});

talentProfileSchema.index({
  status: 1,
  timezone: 1
});

talentProfileSchema.index({
  status: 1,
  region: 1
});

talentProfileSchema.index({
  status: 1,
  engagementPreference: 1
});

talentProfileSchema.index({
  status: 1,
  verificationStatus: 1
});

talentProfileSchema.index({
  skills: 1
});

talentProfileSchema.index({
  categories: 1
});

module.exports = mongoose.model(
  'TalentProfile',
  talentProfileSchema
);