const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Notification } = require('../models/Social');

// GET /notifications — get unread notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id
    }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false
    });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) { next(err); }
});

// PATCH /notifications/read-all — mark all as read
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

// PATCH /notifications/:id/read — mark one as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      $set: { isRead: true, readAt: new Date() }
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
