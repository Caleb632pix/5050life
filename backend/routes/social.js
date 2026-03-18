/**
 * Social Routes — /api/v1/social
 */
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { Post, Comment, Like, Follow, Conversation, Message, Bookmark } = require('../models/Social');
const User = require('../models/User');
const { getRedis } = require('../config/redis');
const notificationService = require('../services/notificationService');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
}

// ── FEED ─────────────────────────────────────────────────────────────────────

// GET /social/feed — personalised home feed
router.get('/feed', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get who the user follows
    const following = await Follow.find({ followerId: req.user.id }, 'followingId');
    const followingIds = following.map(f => f.followingId);
    followingIds.push(req.user.id); // include own posts

    const posts = await Post.find({
      $or: [
        { userId: { $in: followingIds }, visibility: { $in: ['public', 'followers'] } },
        { visibility: 'public' }
      ],
      isHidden: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

    // Attach like status for each post
    const postIds = posts.map(p => p._id.toString());
    const likedPosts = await Like.find({
      userId: req.user.id,
      targetId: { $in: postIds },
      targetType: 'post'
    }, 'targetId');
    const likedSet = new Set(likedPosts.map(l => l.targetId.toString()));

    const bookmarks = await Bookmark.find({ userId: req.user.id, postId: { $in: postIds } }, 'postId');
    const bookmarkSet = new Set(bookmarks.map(b => b.postId.toString()));

    const enriched = posts.map(p => ({
      ...p,
      isLiked:      likedSet.has(p._id.toString()),
      isBookmarked: bookmarkSet.has(p._id.toString())
    }));

    res.json({ success: true, data: { posts: enriched, page: parseInt(page) } });
  } catch (err) { next(err); }
});

// GET /social/explore — trending public posts
router.get('/explore', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sport, hashtag } = req.query;
    const query = { visibility: 'public', isHidden: false };
    if (sport)   query['betData.sport'] = sport;
    if (hashtag) query.hashtags = hashtag.replace('#', '');

    const posts = await Post.find(query)
      .sort({ likesCount: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, data: { posts } });
  } catch (err) { next(err); }
});

// ── POSTS ─────────────────────────────────────────────────────────────────────

// POST /social/posts — create post
router.post('/posts',
  authenticate,
  [body('content').optional().isLength({ max: 2000 })],
  validate,
  async (req, res, next) => {
    try {
      const { content, type = 'text', mediaUrls, hashtags, mentions, visibility, linkedBetId } = req.body;
      if (!content && (!mediaUrls || mediaUrls.length === 0)) {
        return res.status(400).json({ success: false, message: 'Post must have content or media' });
      }

      const post = await Post.create({
        userId:    req.user.id,
        username:  req.user.username,
        avatarUrl: req.user.avatarUrl,
        type, content, mediaUrls,
        hashtags:  hashtags?.map(h => h.replace('#', '').toLowerCase()),
        mentions, visibility, linkedBetId
      });

      // Update user post count
      await User.update({ postsCount: req.user.postsCount + 1 }, { where: { id: req.user.id } });

      // Notify mentioned users
      if (mentions?.length) {
        const mentionedUsers = await User.findAll({ where: { username: mentions } });
        for (const u of mentionedUsers) {
          await notificationService.send(u.id, {
            type: 'mention',
            title: `@${req.user.username} mentioned you`,
            body: content?.substring(0, 100) || 'in a post',
            data: { postId: post._id.toString() }
          });
        }
      }

      res.status(201).json({ success: true, message: 'Post created!', data: { post } });
    } catch (err) { next(err); }
  }
);

// GET /social/posts/:id
router.get('/posts/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post || post.isHidden) return res.status(404).json({ success: false, message: 'Post not found' });

    let isLiked = false, isBookmarked = false;
    if (req.user) {
      const [like, bookmark] = await Promise.all([
        Like.findOne({ userId: req.user.id, targetId: req.params.id, targetType: 'post' }),
        Bookmark.findOne({ userId: req.user.id, postId: req.params.id })
      ]);
      isLiked = !!like;
      isBookmarked = !!bookmark;
    }

    res.json({ success: true, data: { post: { ...post, isLiked, isBookmarked } } });
  } catch (err) { next(err); }
});

// DELETE /social/posts/:id
router.delete('/posts/:id', authenticate, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.userId !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ success: false, message: 'Cannot delete other users posts' });
    }
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) { next(err); }
});

// ── LIKES ─────────────────────────────────────────────────────────────────────
router.post('/posts/:id/like', authenticate, async (req, res, next) => {
  try {
    const existing = await Like.findOne({ userId: req.user.id, targetId: req.params.id, targetType: 'post' });
    if (existing) {
      await existing.deleteOne();
      await Post.findByIdAndUpdate(req.params.id, { $inc: { likesCount: -1 } });
      return res.json({ success: true, liked: false, message: 'Unliked' });
    }

    await Like.create({ userId: req.user.id, targetId: req.params.id, targetType: 'post' });
    const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { likesCount: 1 } }, { new: true });

    // Notify post author
    if (post && post.userId !== req.user.id) {
      await notificationService.send(post.userId, {
        type: 'post_liked',
        title: `@${req.user.username} liked your post`,
        body: post.content?.substring(0, 80) || 'your post',
        data: { postId: req.params.id }
      });
    }

    res.json({ success: true, liked: true, message: 'Liked!' });
  } catch (err) { next(err); }
});

// ── COMMENTS ──────────────────────────────────────────────────────────────────
router.get('/posts/:id/comments', optionalAuth, async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.id, isHidden: false })
      .sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: { comments } });
  } catch (err) { next(err); }
});

router.post('/posts/:id/comments',
  authenticate,
  [body('content').isLength({ min: 1, max: 1000 }).withMessage('Comment cannot be empty')],
  validate,
  async (req, res, next) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

      const comment = await Comment.create({
        postId:   req.params.id,
        userId:   req.user.id,
        username: req.user.username,
        avatarUrl: req.user.avatarUrl,
        content:  req.body.content,
        parentCommentId: req.body.parentCommentId
      });

      await Post.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });

      if (post.userId !== req.user.id) {
        await notificationService.send(post.userId, {
          type: 'post_commented',
          title: `@${req.user.username} commented on your post`,
          body: req.body.content.substring(0, 80),
          data: { postId: req.params.id, commentId: comment._id }
        });
      }

      res.status(201).json({ success: true, data: { comment } });
    } catch (err) { next(err); }
  }
);

// ── FOLLOWS ───────────────────────────────────────────────────────────────────
router.post('/follow/:userId', authenticate, async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const target = await User.findByPk(req.params.userId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    const existing = await Follow.findOne({ followerId: req.user.id, followingId: req.params.userId });
    if (existing) {
      await existing.deleteOne();
      await Promise.all([
        User.update({ followingCount: req.user.followingCount - 1 }, { where: { id: req.user.id } }),
        User.update({ followersCount: target.followersCount - 1 },   { where: { id: target.id } })
      ]);
      return res.json({ success: true, following: false, message: `Unfollowed @${target.username}` });
    }

    await Follow.create({ followerId: req.user.id, followingId: req.params.userId });
    await Promise.all([
      User.update({ followingCount: req.user.followingCount + 1 }, { where: { id: req.user.id } }),
      User.update({ followersCount: target.followersCount + 1 },   { where: { id: target.id } })
    ]);

    await notificationService.send(target.id, {
      type: 'new_follower',
      title: `@${req.user.username} started following you`,
      body:  'Check out their profile and bets',
      data:  { followerId: req.user.id }
    });

    res.json({ success: true, following: true, message: `Now following @${target.username}` });
  } catch (err) { next(err); }
});

// ── BOOKMARKS ─────────────────────────────────────────────────────────────────
router.post('/posts/:id/bookmark', authenticate, async (req, res, next) => {
  try {
    const existing = await Bookmark.findOne({ userId: req.user.id, postId: req.params.id });
    if (existing) {
      await existing.deleteOne();
      await Post.findByIdAndUpdate(req.params.id, { $inc: { bookmarksCount: -1 } });
      return res.json({ success: true, bookmarked: false });
    }
    await Bookmark.create({ userId: req.user.id, postId: req.params.id });
    await Post.findByIdAndUpdate(req.params.id, { $inc: { bookmarksCount: 1 } });
    res.json({ success: true, bookmarked: true });
  } catch (err) { next(err); }
});

router.get('/bookmarks', authenticate, async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    const postIds = bookmarks.map(b => b.postId);
    const posts = await Post.find({ _id: { $in: postIds } }).lean();
    res.json({ success: true, data: { posts } });
  } catch (err) { next(err); }
});

// ── MESSAGES ──────────────────────────────────────────────────────────────────
router.get('/conversations', authenticate, async (req, res, next) => {
  try {
    const convos = await Conversation.find({ participants: req.user.id })
      .sort({ lastActivity: -1 }).lean();
    res.json({ success: true, data: { conversations: convos } });
  } catch (err) { next(err); }
});

router.get('/conversations/:id/messages', authenticate, async (req, res, next) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo || !convo.participants.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const messages = await Message.find({ conversationId: req.params.id, isDeleted: false })
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, data: { messages: messages.reverse() } });
  } catch (err) { next(err); }
});

router.post('/messages',
  authenticate,
  [body('content').optional().isLength({ max: 4000 })],
  async (req, res, next) => {
    try {
      const { recipientId, conversationId, content, type = 'text', mediaUrl, linkedBetId } = req.body;

      let convo = conversationId ? await Conversation.findById(conversationId) : null;

      // Create new DM conversation if needed
      if (!convo && recipientId) {
        const existing = await Conversation.findOne({
          participants: { $all: [req.user.id, recipientId], $size: 2 }
        });
        convo = existing || await Conversation.create({
          participants: [req.user.id, recipientId],
          isGroup: false
        });
      }

      if (!convo) return res.status(400).json({ success: false, message: 'Conversation not found' });
      if (!convo.participants.includes(req.user.id)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const msg = await Message.create({
        conversationId: convo._id,
        senderId:   req.user.id,
        senderName: req.user.username,
        type, content, mediaUrl, linkedBetId
      });

      await Conversation.findByIdAndUpdate(convo._id, {
        lastMessage: { content, senderId: req.user.id, type, sentAt: new Date() },
        lastActivity: new Date()
      });

      // Emit via socket (handled in socketHandler)
      const io = req.app.get('io');
      if (io) {
        io.to(`conversation:${convo._id}`).emit('new_message', {
          message: msg, conversationId: convo._id.toString()
        });
      }

      res.status(201).json({ success: true, data: { message: msg, conversationId: convo._id } });
    } catch (err) { next(err); }
  }
);

// GET /social/hashtag/:tag — posts by hashtag
router.get('/hashtag/:tag', optionalAuth, async (req, res, next) => {
  try {
    const posts = await Post.find({
      hashtags: req.params.tag.toLowerCase(),
      visibility: 'public',
      isHidden: false
    }).sort({ createdAt: -1 }).limit(30).lean();
    res.json({ success: true, data: { posts, hashtag: req.params.tag } });
  } catch (err) { next(err); }
});

// POST /social/report/:postId — report a post
router.post('/report/:postId', authenticate,
  [body('reason').notEmpty().withMessage('Reason required')],
  validate,
  async (req, res, next) => {
    try {
      await Post.findByIdAndUpdate(req.params.postId, { $inc: { reportCount: 1 } });
      res.json({ success: true, message: 'Report submitted. Our moderation team will review.' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
