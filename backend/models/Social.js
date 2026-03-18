/**
 * MongoDB / Mongoose — Social Models
 * Post, Comment, Follow, Message, Conversation, Notification
 */
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// ── POST ─────────────────────────────────────────────────────────────────────
const PostSchema = new Schema({
  userId:   { type: String, required: true, index: true },
  username: { type: String, required: true },
  avatarUrl:{ type: String },
  type: {
    type:    String,
    enum:    ['text', 'image', 'video', 'bet_pick', 'bet_challenge', 'bet_result'],
    default: 'text'
  },
  content:   { type: String, maxlength: 2000 },
  mediaUrls: [{ type: String }],
  // Bet reference (for bet_pick / bet_challenge posts)
  linkedBetId:    { type: String },
  linkedRoomId:   { type: String },
  betData: {
    sport:      String,
    eventName:  String,
    selection:  String,
    odds:       Number,
    stake:      Number,
    result:     String
  },
  hashtags:  [{ type: String, index: true }],
  mentions:  [{ type: String }],       // userIds mentioned
  visibility: {
    type: String, enum: ['public', 'followers', 'private'], default: 'public'
  },
  // Engagement counts (denormalised)
  likesCount:    { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  sharesCount:   { type: Number, default: 0 },
  bookmarksCount:{ type: Number, default: 0 },
  // Repost
  isRepost:        { type: Boolean, default: false },
  originalPostId:  { type: String },
  repostComment:   { type: String, maxlength: 500 },
  // Moderation
  isHidden:        { type: Boolean, default: false },
  hiddenReason:    { type: String },
  reportCount:     { type: Number, default: 0 },
  isPinned:        { type: Boolean, default: false }
}, { timestamps: true });

PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ 'betData.sport': 1 });

// ── COMMENT ──────────────────────────────────────────────────────────────────
const CommentSchema = new Schema({
  postId:   { type: String, required: true, index: true },
  userId:   { type: String, required: true },
  username: { type: String, required: true },
  avatarUrl:{ type: String },
  content:  { type: String, required: true, maxlength: 1000 },
  parentCommentId: { type: String },   // for replies
  mentions: [{ type: String }],
  likesCount:   { type: Number, default: 0 },
  repliesCount: { type: Number, default: 0 },
  isHidden:     { type: Boolean, default: false }
}, { timestamps: true });

CommentSchema.index({ postId: 1, createdAt: 1 });

// ── LIKE ─────────────────────────────────────────────────────────────────────
const LikeSchema = new Schema({
  userId:     { type: String, required: true },
  targetId:   { type: String, required: true },
  targetType: { type: String, enum: ['post', 'comment'], required: true }
}, { timestamps: true });

LikeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });
LikeSchema.index({ targetId: 1, targetType: 1 });

// ── FOLLOW ────────────────────────────────────────────────────────────────────
const FollowSchema = new Schema({
  followerId:  { type: String, required: true, index: true },
  followingId: { type: String, required: true, index: true }
}, { timestamps: true });

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// ── CONVERSATION (DMs & Group Chats) ─────────────────────────────────────────
const ConversationSchema = new Schema({
  participants: [{ type: String }],
  isGroup:     { type: Boolean, default: false },
  name:        { type: String },    // group chat name
  avatarUrl:   { type: String },
  adminIds:    [{ type: String }],
  // Linked to betting room
  roomId:      { type: String },
  lastMessage: {
    content:   String,
    senderId:  String,
    type:      { type: String, default: 'text' },
    sentAt:    Date
  },
  lastActivity: { type: Date, default: Date.now },
  isArchived:  { type: Boolean, default: false }
}, { timestamps: true });

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastActivity: -1 });
ConversationSchema.index({ roomId: 1 });

// ── MESSAGE ───────────────────────────────────────────────────────────────────
const MessageSchema = new Schema({
  conversationId: { type: String, required: true, index: true },
  senderId:   { type: String, required: true },
  senderName: { type: String },
  type: {
    type:    String,
    enum:    ['text', 'image', 'gif', 'video', 'bet_challenge', 'system'],
    default: 'text'
  },
  content:   { type: String, maxlength: 4000 },
  mediaUrl:  { type: String },
  linkedBetId: { type: String },   // send a bet challenge via DM
  readBy:    [{ userId: String, readAt: Date }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: true });

MessageSchema.index({ conversationId: 1, createdAt: -1 });

// ── NOTIFICATION ──────────────────────────────────────────────────────────────
const NotificationSchema = new Schema({
  userId:  { type: String, required: true, index: true },
  type: {
    type: String,
    enum: [
      'bet_accepted', 'bet_won', 'bet_lost', 'bet_void',
      'room_joined', 'room_result',
      'new_follower', 'post_liked', 'post_commented', 'mention',
      'message_received', 'bet_challenge_received',
      'deposit_confirmed', 'withdrawal_processed', 'withdrawal_rejected',
      'kyc_approved', 'kyc_rejected',
      'promo', 'system'
    ],
    required: true
  },
  title:   { type: String, required: true },
  body:    { type: String, required: true },
  data:    { type: Schema.Types.Mixed },
  imageUrl:{ type: String },
  actionUrl:{ type: String },
  isRead:  { type: Boolean, default: false, index: true },
  readAt:  { type: Date },
  isSent:  { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

// ── BOOKMARK ──────────────────────────────────────────────────────────────────
const BookmarkSchema = new Schema({
  userId: { type: String, required: true },
  postId: { type: String, required: true }
}, { timestamps: true });

BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = {
  Post:         model('Post',         PostSchema),
  Comment:      model('Comment',      CommentSchema),
  Like:         model('Like',         LikeSchema),
  Follow:       model('Follow',       FollowSchema),
  Conversation: model('Conversation', ConversationSchema),
  Message:      model('Message',      MessageSchema),
  Notification: model('Notification', NotificationSchema),
  Bookmark:     model('Bookmark',     BookmarkSchema)
};
