const Article = require('../models/Article');
const ArticleRevision = require('../models/ArticleRevision');
const EditorialComment = require('../models/EditorialComment');
const Author = require('../models/Author');
const User = require('../models/User');

const {
  createNotification
} = require('../services/notificationService');

const makeSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const createRevision = async (article, userId, changeNote) => {
  return ArticleRevision.create({
    article: article._id,
    version: article.revisionNumber || 1,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    tags: article.tags,
    seo: article.seo,
    references: article.references,
    createdBy: userId,
    changeNote
  });
};

exports.createArticle = async (req, res) => {
  try {
    let author = await Author.findOne({
      user: req.user.id,
      deletedAt: null
    });

    if (!author && (req.user.role === 'admin' || req.user.role === 'scriza_staff' || req.user.role === 'contributor')) {
      author = await Author.create({
        user: req.user.id,
        name: req.user.name || 'Scriza Contributor',
        displayName: req.user.name || 'Scriza Contributor',
        penName: req.user.name || 'Scriza Contributor',
        bio: 'Verified Technical Author at Scrizians',
        status: 'Approved'
      });
    }

    if (!author || (author.status !== 'Approved' && req.user.role !== 'admin' && req.user.role !== 'scriza_staff' && req.user.role !== 'contributor')) {
      return res.status(403).json({
        success: false,
        message: 'Approved author profile is required.',
        requestId: req.requestId
      });
    }

    const {
      title,
      excerpt,
      content,
      category,
      tags,
      featuredImage,
      seo,
      references
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required.',
        requestId: req.requestId
      });
    }

    let slug = makeSlug(title);

    const existing = await Article.findOne({ slug });

    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const status = req.body.status || (req.user.role === 'admin' || req.user.role === 'scriza_staff' ? 'Published' : 'Draft');
    const publishedAt = status === 'Published' ? (req.body.publishedAt ? new Date(req.body.publishedAt) : new Date()) : null;

    const article = await Article.create({
      title,
      slug,
      excerpt: excerpt || title,
      content,
      author: author._id,
      category: category || 'Engineering',
      tags: Array.isArray(tags) ? tags : [],
      featuredImage,
      seo,
      references: Array.isArray(references)
        ? references
        : [],
      status,
      publishedAt
    });

    await createRevision(
      article,
      req.user.id,
      'Initial article version'
    );

    return res.status(201).json({
      success: true,
      message: 'Article created.',
      data: article,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('createArticle:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to create article.',
      requestId: req.requestId
    });
  }
};

exports.getMyArticles = async (req, res) => {
  try {
    let author = await Author.findOne({
      user: req.user.id,
      deletedAt: null
    });

    if (!author && (req.user.role === 'contributor' || req.user.role === 'admin' || req.user.role === 'scriza_staff')) {
      author = await Author.create({
        user: req.user.id,
        name: req.user.name || 'Scriza Contributor',
        displayName: req.user.name || 'Scriza Contributor',
        penName: req.user.name || 'Scriza Contributor',
        bio: 'Verified Technical Author at Scrizians',
        status: 'Approved'
      });
    }

    if (!author) {
      return res.status(200).json({
        success: true,
        data: [],
        requestId: req.requestId
      });
    }

    const articles = await Article.find({
      author: author._id,
      deletedAt: null
    }).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: articles,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch articles.',
      requestId: req.requestId
    });
  }
};

exports.getPublicArticles = async (req, res) => {
  try {
    const filter = {
      status: 'Published',
      deletedAt: null
    };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const articles = await Article.find(filter)
      .populate(
        'author',
        'displayName bio avatar expertise designation'
      )
      .select(
        'title slug excerpt author category tags featuredImage seo publishedAt'
      )
      .sort({ publishedAt: -1 });

    return res.status(200).json({
      success: true,
      data: articles,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch articles.',
      requestId: req.requestId
    });
  }
};

exports.getArticleBySlug = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const slug = req.params.slug;
    const query = {
      status: 'Published',
      deletedAt: null,
      $or: [{ slug: slug.toLowerCase() }]
    };

    if (mongoose.Types.ObjectId.isValid(slug)) {
      query.$or.push({ _id: slug });
    }

    const article = await Article.findOne(query).populate(
      'author',
      'displayName bio avatar expertise designation'
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
        requestId: req.requestId
      });
    }

    return res.status(200).json({
      success: true,
      data: article,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch article.',
      requestId: req.requestId
    });
  }
};

exports.updateMyArticle = async (req, res) => {
  try {
    const author = await Author.findOne({
      user: req.user.id,
      deletedAt: null
    });

    const article = await Article.findOne({
      _id: req.params.id,
      author: author?._id,
      deletedAt: null
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
        requestId: req.requestId
      });
    }

    if (
      ![
        'Draft',
        'Rejected'
      ].includes(article.status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Article cannot be edited in its current status.',
        requestId: req.requestId
      });
    }

    const fields = [
      'title',
      'excerpt',
      'content',
      'category',
      'tags',
      'featuredImage',
      'seo',
      'references'
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        article[field] = req.body[field];
      }
    });

    article.revisionNumber += 1;

    await article.save();

    await createRevision(
      article,
      req.user.id,
      'Article updated'
    );

    return res.status(200).json({
      success: true,
      message: 'Article updated.',
      data: article,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('updateMyArticle:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update article.',
      requestId: req.requestId
    });
  }
};

exports.submitArticle = async (req, res) => {
  try {
    const author = await Author.findOne({
      user: req.user.id,
      deletedAt: null
    });

    const article = await Article.findOne({
      _id: req.params.id,
      author: author?._id,
      deletedAt: null
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
        requestId: req.requestId
      });
    }

    if (!['Draft', 'Rejected'].includes(article.status)) {
      return res.status(400).json({
        success: false,
        message: 'Article cannot be submitted now.',
        requestId: req.requestId
      });
    }

    article.status = 'Submitted';
    await article.save();

    const staff = await User.find({
      role: {
        $in: ['scriza_staff', 'admin']
      },
      accountStatus: 'active'
    }).select('_id');

    await Promise.all(
      staff.map((user) =>
        createNotification({
          recipient: user._id,
          type: 'ARTICLE_SUBMITTED',
          title: 'New article submitted',
          message: `${article.title} is ready for review.`,
          entityType: 'Article',
          entityId: article._id
        })
      )
    );

    return res.status(200).json({
      success: true,
      message: 'Article submitted for review.',
      data: {
        id: article._id,
        status: article.status
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error('submitArticle:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to submit article.',
      requestId: req.requestId
    });
  }
};

exports.getAdminArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      deletedAt: null
    })
      .populate(
        'author',
        'displayName designation status'
      )
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: articles,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch articles.',
      requestId: req.requestId
    });
  }
};

exports.moveArticleWorkflow = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;
    const allowed = [
      'Draft',
      'Submitted',
      'Review',
      'Technical/Fact',
      'SEO',
      'Approved',
      'Published',
      'Rejected'
    ];

    const { status } = req.body;

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow status.',
        requestId: req.requestId
      });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, deletedAt: null }
      : { slug: id, deletedAt: null };

    const article = await Article.findOne(query).populate('author');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
        requestId: req.requestId
      });
    }

    article.status = status;
    await article.save();

    if (article.author?.user) {
      await createNotification({
        recipient: article.author.user,
        type:
          status === 'Approved'
            ? 'ARTICLE_APPROVED'
            : 'ARTICLE_REVIEW',
        title: 'Article workflow updated',
        message: `${article.title} moved to ${status}.`,
        entityType: 'Article',
        entityId: article._id
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `Article moved to ${status}.`,
      data: {
        id: article._id,
        status: article.status
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error('moveArticleWorkflow:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to update article workflow.',
      requestId: req.requestId
    });
  }
};

exports.scheduleArticle = async (req, res) => {
  try {
    const { scheduledAt } = req.body;

    const date = new Date(scheduledAt);

    if (!scheduledAt || Number.isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Valid scheduledAt is required.',
        requestId: req.requestId
      });
    }

    if (date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future.',
        requestId: req.requestId
      });
    }

    const mongoose = require('mongoose');
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, deletedAt: null }
      : { slug: id, deletedAt: null };

    const article = await Article.findOne(query).populate('author');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
        requestId: req.requestId
      });
    }

    if (!['Approved', 'Draft', 'Submitted', 'Review'].includes(article.status)) {
      return res.status(400).json({
        success: false,
        message: 'Article cannot be scheduled in current status.',
        requestId: req.requestId
      });
    }

    article.status = 'Scheduled';
    article.scheduledAt = date;

    await article.save();

    if (article.author?.user) {
      await createNotification({
        recipient: article.author.user,
        type: 'ARTICLE_SCHEDULED',
        title: 'Article scheduled',
        message: `${article.title} has been scheduled for publishing.`,
        entityType: 'Article',
        entityId: article._id
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: 'Article scheduled.',
      data: {
        id: article._id,
        status: article.status,
        scheduledAt: article.scheduledAt
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error('scheduleArticle error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to schedule article.',
      requestId: req.requestId
    });
  }
};

exports.publishArticle = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id, deletedAt: null }
      : { slug: id, deletedAt: null };

    const article = await Article.findOne(query).populate('author');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
        requestId: req.requestId
      });
    }

    article.status = 'Published';
    article.publishedAt = new Date();

    await article.save();

    if (article.author?.user) {
      await createNotification({
        recipient: article.author.user,
        type: 'ARTICLE_PUBLISHED',
        title: 'Article published',
        message: `${article.title} is now published.`,
        entityType: 'Article',
        entityId: article._id
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: 'Article published.',
      data: {
        id: article._id,
        status: article.status,
        publishedAt: article.publishedAt
      },
      requestId: req.requestId
    });
  } catch (error) {
    console.error('publishArticle error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to publish article.',
      requestId: req.requestId
    });
  }
};

exports.adminUpdateArticle = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;
    const updateData = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }] }
      : { slug: id };

    const article = await Article.findOne(query);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    Object.assign(article, updateData);
    await article.save();

    return res.status(200).json({
      success: true,
      message: 'Article updated successfully.',
      data: article
    });
  } catch (error) {
    console.error('adminUpdateArticle:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to update article.'
    });
  }
};

exports.adminDeleteArticle = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }] }
      : { slug: id };

    const article = await Article.findOneAndDelete(query);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Article deleted successfully.'
    });
  } catch (error) {
    console.error('adminDeleteArticle:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to delete article.'
    });
  }
};

exports.deleteMyArticle = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Author = require('../models/Author');
    const { id } = req.params;

    const author = await Author.findOne({
      user: req.user.id || req.user._id,
      deletedAt: null
    });

    const authorId = author ? author._id : (req.user.id || req.user._id);

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }], author: authorId }
      : { slug: id, author: authorId };

    const article = await Article.findOneAndDelete(query);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found or unauthorized.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Article deleted successfully.'
    });
  } catch (error) {
    console.error('deleteMyArticle:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to delete article.'
    });
  }
};