const Author = require('../models/Author');

exports.createAuthor = async (req, res) => {
  try {
    const existing = await Author.findOne({
      user: req.user.id,
      deletedAt: null
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Author profile already exists.',
        requestId: req.requestId
      });
    }

    const {
      displayName,
      bio,
      avatar,
      expertise,
      designation,
      socialLinks
    } = req.body;

    if (!displayName) {
      return res.status(400).json({
        success: false,
        message: 'Display name is required.',
        requestId: req.requestId
      });
    }

    const author = await Author.create({
      user: req.user.id,
      displayName,
      bio,
      avatar,
      expertise: Array.isArray(expertise) ? expertise : [],
      designation,
      socialLinks
    });

    return res.status(201).json({
      success: true,
      message: 'Author profile created.',
      data: author,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('createAuthor:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to create author profile.',
      requestId: req.requestId
    });
  }
};

exports.getMyAuthor = async (req, res) => {
  try {
    const author = await Author.findOne({
      user: req.user.id,
      deletedAt: null
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author profile not found.',
        requestId: req.requestId
      });
    }

    return res.status(200).json({
      success: true,
      data: author,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch author profile.',
      requestId: req.requestId
    });
  }
};

exports.updateMyAuthor = async (req, res) => {
  try {
    const author = await Author.findOne({
      user: req.user.id,
      deletedAt: null
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author profile not found.',
        requestId: req.requestId
      });
    }

    const allowedFields = [
      'displayName',
      'bio',
      'avatar',
      'expertise',
      'designation',
      'socialLinks'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        author[field] = req.body[field];
      }
    });

    await author.save();

    return res.status(200).json({
      success: true,
      message: 'Author profile updated.',
      data: author,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to update author profile.',
      requestId: req.requestId
    });
  }
};

exports.getPublicAuthors = async (req, res) => {
  try {
    const authors = await Author.find({
      status: 'Approved',
      deletedAt: null
    })
      .select(
        'displayName bio avatar expertise designation status'
      )
      .sort({ displayName: 1 });

    return res.status(200).json({
      success: true,
      data: authors,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch authors.',
      requestId: req.requestId
    });
  }
};

exports.approveAuthor = async (req, res) => {
  try {
    const author = await Author.findOne({
      _id: req.params.id,
      deletedAt: null
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found.',
        requestId: req.requestId
      });
    }

    author.status = 'Approved';
    author.approvedBy = req.user.id;
    author.approvedAt = new Date();

    await author.save();

    return res.status(200).json({
      success: true,
      message: 'Author approved.',
      data: {
        id: author._id,
        status: author.status
      },
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to approve author.',
      requestId: req.requestId
    });
  }
};
