const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  try {
    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      50
    );

    const skip = (page - 1) * limit;

    const [notifications, total, unread] =
      await Promise.all([
        Notification.find({
          recipient: req.user.id
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),

        Notification.countDocuments({
          recipient: req.user.id
        }),

        Notification.countDocuments({
          recipient: req.user.id,
          read: false
        })
      ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unread,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to fetch notifications.',
      requestId: req.requestId
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
        requestId: req.requestId
      });
    }

    notification.read = true;
    notification.readAt = new Date();

    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to update notification.',
      requestId: req.requestId
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user.id,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      requestId: req.requestId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to update notifications.',
      requestId: req.requestId
    });
  }
};