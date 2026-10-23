const bcrypt = require('bcrypt');

const TalentProfile = require('../models/TalentProfile');
const Lead = require('../models/Lead');
const Job = require('../models/Job');
const Article = require('../models/Article');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

const MAX_AUDIT_LOGS = 10;

exports.getAdminDashboardStats = async (
  req,
  res
) => {
  try {
    const [
      totalTalent,
      verifiedTalent,
      pendingVerification,
      totalLeads,
      activeJobs,
      totalArticles,
      recentAuditLogs
    ] = await Promise.all([
      TalentProfile.countDocuments({
        deletedAt: null
      }),

      TalentProfile.countDocuments({
        status: 'approved',
        deletedAt: null
      }),

      TalentProfile.countDocuments({
        status: {
          $in: [
            'pending',
            'draft'
          ]
        },
        deletedAt: null
      }),

      Lead.countDocuments({
        deletedAt: null
      }),

      Job.countDocuments({
        status: 'Active'
      }),

      Article.countDocuments(),

      AuditLog.find()
        .sort({
          timestamp: -1,
          _id: -1
        })
        .limit(MAX_AUDIT_LOGS)
        .lean()
    ]);

    return res.status(200).json({
      success: true,

      data: {
        totalTalent,
        verifiedTalent,
        pendingVerification,
        totalLeads,
        activeJobs,
        totalArticles,
        recentAuditLogs
      },

      stats: {
        totalTalent,
        verifiedTalent,
        pendingVerification,
        totalLeads,
        activeJobs,
        totalArticles
      },

      recentAuditLogs,

      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Admin] Dashboard stats error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to load admin dashboard statistics.',
      requestId: req.requestId
    });
  }
};


// Approve Talent Profile
exports.approveTalent = async (
  req,
  res
) => {
  try {
    const { scrizianId } = req.params;

    if (!/^(SCR-\d+|SZN-[A-Z]+-\d+|[A-Z0-9-]+)$/i.test(scrizianId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Scrizian ID.',
        requestId: req.requestId
      });
    }

    const talent = await TalentProfile.findOne({
      scrizianId: scrizianId.toUpperCase(),
      deletedAt: null
    });

    if (!talent) {
      return res.status(404).json({
        success: false,
        message: 'Talent profile not found.',
        requestId: req.requestId
      });
    }

    if (talent.status === 'approved') {
      return res.status(409).json({
        success: false,
        message: 'Talent profile is already approved.',
        requestId: req.requestId
      });
    }

    talent.status = 'approved';
    talent.verificationStatus = 'verified';
    talent.relationshipBadge = 'Verified Scrizian';

    talent.review = {
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      notes:
        req.body?.notes ||
        'Talent profile approved by admin.'
    };

    await talent.save();

   await AuditLog.create({
  action: 'talent_profile_approved',
  performedBy: req.user.id,
  role: req.user.role,
  targetType: 'TalentProfile',
  targetId: talent._id,
  details: `Talent profile ${talent.scrizianId} approved.`,
  requestId: req.requestId
});

    return res.status(200).json({
      success: true,
      message:
        'Talent profile approved successfully.',
      data: talent.toPublicJSON(),
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Admin] Talent approval error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to approve talent profile.',
      requestId: req.requestId
    });
  }
};


// Development-only Staff Creation
exports.createDevStaff = async (
  req,
  res
) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message:
          'Development staff creation is disabled in production.',
        requestId: req.requestId
      });
    }

    const {
      name,
      email,
      password
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email and password are required.',
        requestId: req.requestId
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 8 characters.',
        requestId: req.requestId
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          'A user with this email already exists.',
        requestId: req.requestId
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const staff = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'scriza_staff',
      accountStatus: 'active',
      consent: {
        accepted: true,
        version: 'dev'
      }
    });

    return res.status(201).json({
      success: true,
      message:
        'Development staff account created successfully.',
      data: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        accountStatus:
          staff.accountStatus
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Admin] Development staff creation error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to create development staff account.',
      requestId: req.requestId
    });
  }
};


exports.getRequirements = async (req, res) => {
  try {
    const Requirement =
      require('../models/Requirement');

    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 20,
        1
      ),
      50
    );

    const skip = (page - 1) * limit;

    const filter = {
      deletedAt: null
    };

    const [requirements, total] =
      await Promise.all([
        Requirement.find(filter)
          .populate(
            'client',
            'name email company'
          )
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
        totalPages: Math.ceil(
          total / limit
        )
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Admin] Requirements list error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to fetch requirements.',
      requestId: req.requestId
    });
  }
};

exports.reviewRequirement = async (req, res) => {
  try {
    const Requirement =
      require('../models/Requirement');

    const requirement =
      await Requirement.findOne({
        _id: req.params.id,
        deletedAt: null
      });

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found.',
        requestId: req.requestId
      });
    }

    const targetStatus = req.body.status || 'Reviewing';
    requirement.status = targetStatus;

    await requirement.save();

    return res.status(200).json({
      success: true,
      message:
        `Requirement moved to ${targetStatus} stage.`,
      data: {
        id: requirement._id,
        status: requirement.status
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error(
      '[Admin] Requirement review error:',
      {
        requestId: req.requestId,
        message: error.message
      }
    );

    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to review requirement.',
      requestId: req.requestId
    });
  }
};

/*
 * GET USERS LIST (Admin RBAC Management)
 */
exports.getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};
    if (role && role !== 'all') query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { scrizianId: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query)
      .select('name email phone role avatar title scrizianId accountStatus isVerified emailVerified createdAt updatedAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/*
 * CREATE USER (Admin Add User) - Hardened RBAC & Safe Response (F-01, F-03)
 */
exports.createUser = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only authorized administrators can create new users.'
      });
    }

    const { name, email, phone, password, role, avatar, title } = req.body;
    if (!name || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: 'Name and either email or phone are required.'
      });
    }

    const validRoles = ['client', 'scrizian', 'contributor', 'candidate', 'scriza_staff', 'admin'];
    const targetRole = role ? role.toLowerCase().trim() : 'client';
    if (!validRoles.includes(targetRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Allowed roles: ${validRoles.join(', ')}`
      });
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
    if (normalizedEmail) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email address already exists.'
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password || 'Scriza@123', 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : undefined,
      password: hashedPassword,
      role: targetRole,
      avatar: avatar || null,
      title: title || null,
      isVerified: true,
      emailVerified: true,
      accountStatus: 'active'
    });

    await AuditLog.create({
      action: 'user_created',
      performedBy: req.user.id,
      role: req.user.role,
      targetType: 'User',
      targetId: user._id,
      details: `Administrator created user ${user.email || user.phone} with role ${user.role}.`,
      requestId: req.requestId
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user.toSafeJSON()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/*
 * UPDATE USER (Admin Edit User) - Privilege Escalation Safeguards (F-01, F-03)
 */
exports.updateUser = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only authorized administrators can modify user records.'
      });
    }

    const { id } = req.params;
    const { name, email, phone, role, avatar, title, accountStatus } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safeguard: Prevent self-role modification (cannot promote/demote oneself)
    if (req.user.id === user._id.toString() && role && role !== user.role) {
      return res.status(400).json({
        success: false,
        message: 'You cannot alter your own administrative role.'
      });
    }

    // Safeguard: Prevent demoting or altering the primary admin account
    if (user.email === 'admin@scrizians.com' && role && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'The primary system administrator role cannot be altered.'
      });
    }

    if (role) {
      const validRoles = ['client', 'scrizian', 'contributor', 'candidate', 'scriza_staff', 'admin'];
      const targetRole = role.toLowerCase().trim();
      if (!validRoles.includes(targetRole)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role specified. Allowed roles: ${validRoles.join(', ')}`
        });
      }
      user.role = targetRole;
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (phone) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (title !== undefined) user.title = title;
    if (accountStatus) user.accountStatus = accountStatus;

    await user.save();

    await AuditLog.create({
      action: 'user_updated',
      performedBy: req.user.id,
      role: req.user.role,
      targetType: 'User',
      targetId: user._id,
      details: `Administrator updated user ${user.email} (Role: ${user.role}, Status: ${user.accountStatus}).`,
      requestId: req.requestId
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user.toSafeJSON()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/*
 * DELETE USER (Admin Delete User) - Self-Deletion & Root Admin Protection (F-01)
 */
exports.deleteUser = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only authorized administrators can delete users.'
      });
    }

    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Safeguard: Prevent self-deletion
    if (req.user.id === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrator account.'
      });
    }

    // Safeguard: Prevent deleting primary system admin
    if (user.email === 'admin@scrizians.com') {
      return res.status(403).json({
        success: false,
        message: 'The primary system administrator account cannot be deleted.'
      });
    }

    await User.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'user_deleted',
      performedBy: req.user.id,
      role: req.user.role,
      targetType: 'User',
      targetId: id,
      details: `Administrator deleted user ${user.email || user.name} (${user.role}).`,
      requestId: req.requestId
    });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/*
 * DELETE REQUIREMENT (Admin Delete Requirement)
 */
exports.deleteRequirement = async (req, res) => {
  try {
    const Requirement = require('../models/Requirement');
    const { id } = req.params;
    const reqDoc = await Requirement.findById(id);
    if (!reqDoc) {
      return res.status(404).json({ success: false, message: 'Requirement not found' });
    }
    await Requirement.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: 'Requirement deleted successfully'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};