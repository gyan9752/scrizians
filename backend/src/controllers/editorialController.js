const Article = require('../models/Article');
const ArticleRevision = require('../models/ArticleRevision');
const EditorialComment = require('../models/EditorialComment');

const {
  createNotification
} = require('../services/notificationService');

exports.getRevisions = async (req, res) => {
  try {
    const revisions = await ArticleRevision.find({
      article: req.params.articleId
    })
      .populate('createdBy', 'name email role')
      .sort({ version: -1 });

    return res.status(200).json({
      success: true,
      data: revisions,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch revisions.',
      requestId: req.requestId
    });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await EditorialComment.find({
      article: req.params.articleId
    })
      .populate('author', 'name email role')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: comments,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch editorial comments.',
      requestId: req.requestId
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const {
      comment,
      type,
      revision
    } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required.',
        requestId: req.requestId
      });
    }

    const article = await Article.findOne({
      _id: req.params.articleId,
      deletedAt: null
    }).populate('author');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.',
        requestId: req.requestId
      });
    }

    const editorialComment = await EditorialComment.create({
      article: article._id,
      revision,
      author: req.user.id,
      comment,
      type: type || 'General'
    });

    await createNotification({
      recipient: article.author.user,
      type: 'ARTICLE_COMMENT',
      title: 'New editorial comment',
      message: `A new comment was added to "${article.title}".`,
      entityType: 'Article',
      entityId: article._id
    });

    return res.status(201).json({
      success: true,
      message: 'Editorial comment added.',
      data: editorialComment,
      requestId: req.requestId
    });
  } catch (error) {
    console.error('addComment:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to add editorial comment.',
      requestId: req.requestId
    });
  }
};

exports.resolveComment = async (req, res) => {
  try {
    const comment = await EditorialComment.findOne({
      _id: req.params.commentId
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Editorial comment not found.',
        requestId: req.requestId
      });
    }

    comment.resolved = true;
    comment.resolvedBy = req.user.id;
    comment.resolvedAt = new Date();

    await comment.save();

    return res.status(200).json({
      success: true,
      message: 'Editorial comment resolved.',
      data: comment,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to resolve comment.',
      requestId: req.requestId
    });
  }
};