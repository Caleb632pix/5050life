const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { BettingRoom, RoomParticipant } = require('../models/BettingRoom');

// GET /rooms — list open rooms
router.get('/', authenticate, async (req, res, next) => {
  try {
    const rooms = await BettingRoom.findAll({
      where: { status: ['open', 'active'], isPrivate: false },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json({ success: true, data: { rooms } });
  } catch (err) { next(err); }
});

// GET /rooms/:id — get single room
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const room = await BettingRoom.findByPk(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: { room } });
  } catch (err) { next(err); }
});

// POST /rooms — create a room
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, sport, entryFee, maxParticipants, payoutType, isPrivate } = req.body;
    const room = await BettingRoom.create({
      name, sport, entryFee: entryFee || 0,
      maxParticipants: maxParticipants || 50,
      payoutType: payoutType || 'winner_takes_all',
      isPrivate: isPrivate || false,
      createdBy: req.user.id,
      status: 'open'
    });
    await RoomParticipant.create({
      roomId: room.id, userId: req.user.id, role: 'admin'
    });
    res.status(201).json({ success: true, data: { room } });
  } catch (err) { next(err); }
});

// POST /rooms/:id/join — join a room
router.post('/:id/join', authenticate, async (req, res, next) => {
  try {
    const room = await BettingRoom.findByPk(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    const existing = await RoomParticipant.findOne({
      where: { roomId: req.params.id, userId: req.user.id }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Already joined' });
    await RoomParticipant.create({ roomId: req.params.id, userId: req.user.id });
    await room.update({ currentParticipants: room.currentParticipants + 1 });
    res.json({ success: true, message: 'Joined room!' });
  } catch (err) { next(err); }
});

module.exports = router;
