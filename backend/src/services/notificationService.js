const Notification = require('../models/Notification');

exports.createNotification = async ({
  recipient,
  type,
  title,
  message,
  entityType,
  entityId
}) => {
  try {
    if (!recipient) return null;

    return await Notification.create({
      recipient,
      type,
      title,
      message,
      entityType,
      entityId
    });
  } catch (error) {
    console.error(
      'createNotification:',
      error.message
    );

    return null;
  }
};