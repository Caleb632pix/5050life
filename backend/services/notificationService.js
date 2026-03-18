/**
 * Notification Service
 */
const { Notification } = require('../models/Social');
const { emitToUser }   = require('../sockets/socketHandler');
const logger           = require('../config/logger');

class NotificationService {
  async send(userId, { type, title, body, data, imageUrl, actionUrl }) {
    try {
      const notif = await Notification.create({
        userId, type, title, body, data, imageUrl, actionUrl
      });

      // Real-time via Socket.io
      emitToUser(userId, 'notification', {
        id:    notif._id, type, title, body, data, createdAt: notif.createdAt
      });

      // Push notification (Firebase)
      await this._sendPush(userId, title, body, data);

      return notif;
    } catch (err) {
      logger.warn(`Notification failed for ${userId}:`, err.message);
    }
  }

  async _sendPush(userId, title, body, data) {
    try {
      const User = require('../models/User');
      const user = await User.findByPk(userId, { attributes: ['fcmToken', 'notifyBetResult'] });
      if (!user?.fcmToken) return;

      // Firebase Admin (initialise in production)
      // const admin = require('firebase-admin');
      // await admin.messaging().send({ token: user.fcmToken, notification: { title, body }, data });
    } catch (err) {
      logger.warn('Push notification failed:', err.message);
    }
  }

  async getUnread(userId) {
    return Notification.find({ userId, isRead: false }).sort({ createdAt: -1 }).limit(50);
  }

  async markRead(userId, notificationIds) {
    await Notification.updateMany(
      { _id: { $in: notificationIds }, userId },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }

  async markAllRead(userId) {
    await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
  }
}

module.exports = new NotificationService();
