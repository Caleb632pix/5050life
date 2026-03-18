/**
 * Socket Service — real-time connection management
 */
import { io } from 'socket.io-client';
import store from '../store';
import { updateBet } from '../store/slices/betSlice';
import { addNotification } from '../store/slices/walletSlice';
import { updateBalance }   from '../store/slices/walletSlice';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function initSocket() {
  const token = localStorage.getItem('accessToken');
  if (!token || socket?.connected) return;

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnectionAttempts: 5,
    reconnectionDelay:    1000,
    transports:           ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket error:', err.message);
  });

  // ── Bet updates ───────────────────────────────────────────────────────
  socket.on('bet_update', (bet) => {
    store.dispatch(updateBet(bet));
  });

  // ── Notifications ────────────────────────────────────────────────────
  socket.on('notification', (notif) => {
    store.dispatch(addNotification(notif));

    // Show toast for bet results
    if (notif.type === 'bet_won') {
      toast.success(`🎉 ${notif.title}`, { duration: 5000 });
      triggerWinConfetti();
    } else if (notif.type === 'bet_lost') {
      toast.error(`😔 ${notif.title}`, { duration: 5000 });
    } else if (notif.type === 'deposit_confirmed') {
      toast.success(`💰 ${notif.body}`, { duration: 4000 });
      store.dispatch(updateBalance(notif.data?.newBalance));
    } else {
      toast(notif.title, { duration: 3000 });
    }
  });

  // ── Live score updates ────────────────────────────────────────────────
  socket.on('score_update', (data) => {
    window.dispatchEvent(new CustomEvent('score_update', { detail: data }));
  });

  // ── Odds updates ──────────────────────────────────────────────────────
  socket.on('odds_update', (data) => {
    window.dispatchEvent(new CustomEvent('odds_update', { detail: data }));
  });

  // ── New messages ──────────────────────────────────────────────────────
  socket.on('new_message', (data) => {
    window.dispatchEvent(new CustomEvent('new_message', { detail: data }));
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

export function getSocket() { return socket; }

export function joinConversation(conversationId) {
  socket?.emit('join_conversation', { conversationId });
}

export function leaveConversation(conversationId) {
  socket?.emit('leave_conversation', { conversationId });
}

export function startTyping(conversationId) {
  socket?.emit('typing_start', { conversationId });
}

export function stopTyping(conversationId) {
  socket?.emit('typing_stop', { conversationId });
}

export function watchBet(betId) {
  socket?.emit('watch_bet', { betId });
}

export function watchEvent(eventId) {
  socket?.emit('watch_event', { eventId });
}

export function joinRoom(roomId) {
  socket?.emit('join_betting_room', { roomId });
}

// ── Win confetti ──────────────────────────────────────────────────────────
function triggerWinConfetti() {
  const colors = ['red', 'blue'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = `confetti-piece confetti-${colors[i % 2]}`;
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.animationDelay = `${Math.random() * 2}s`;
    piece.style.animationDuration = `${2 + Math.random() * 2}s`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 5000);
  }
}
