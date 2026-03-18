import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 520 }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)'
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: width,
        maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.2s ease'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid var(--border)'
        }}>
          <h3 style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex'
          }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ── Bet status badge ─────────────────────────────────────────────────────────
export function BetBadge({ status, result }) {
  const map = {
    open:     { cls: 'badge-open',     label: '● OPEN' },
    matched:  { cls: 'badge-matched',  label: '⚡ MATCHED' },
    settled:  { cls: 'badge-settled',  label: '✓ SETTLED' },
    cancelled:{ cls: 'badge-settled',  label: '✕ CANCELLED' },
    disputed: { cls: 'badge-matched',  label: '⚠ DISPUTED' },
    live:     { cls: 'badge-live',     label: '● LIVE' },
    win:      { cls: 'badge-win',      label: '🏆 WON' },
    loss:     { cls: 'badge-loss',     label: '✕ LOST' },
  };
  const key = result === 'win' ? 'win' : result === 'loss' ? 'loss' : status;
  const { cls, label } = map[key] || { cls: 'badge-settled', label: status?.toUpperCase() };
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Sport badge ───────────────────────────────────────────────────────────────
export function SportBadge({ sport }) {
  const icons = {
    football: '⚽', soccer: '⚽', cricket: '🏏', basketball: '🏀',
    tennis: '🎾', mma: '🥊', boxing: '🥊', golf: '⛳', esports: '🎮',
    baseball: '⚾', rugby: '🏉', custom: '🎯'
  };
  const icon = icons[sport?.toLowerCase()] || '🎯';
  return (
    <span className="sport-badge">{icon} {sport?.toUpperCase()}</span>
  );
}

// ── Notification panel ───────────────────────────────────────────────────────
export function NotificationPanel({ onClose }) {
  const [notifs] = React.useState([
    { id: 1, type: 'bet_won',  title: '🎉 You won your bet!',     body: 'Man City vs Arsenal — £50 net payout',  time: '2m ago' },
    { id: 2, type: 'new_follower', title: 'New follower',         body: '@kingbettor started following you',       time: '14m ago' },
    { id: 3, type: 'bet_accepted', title: 'Bet accepted!',        body: '@pro_tipster accepted your NFL bet',      time: '1h ago' },
    { id: 4, type: 'deposit',  title: 'Deposit confirmed',        body: '$200 added to your wallet',               time: '3h ago' },
  ]);

  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 14, right: 14,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 12, zIndex: 200,
      boxShadow: '0 -8px 24px rgba(0,0,0,0.4)', marginBottom: 8
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={14} />
        </button>
      </div>
      {notifs.map(n => (
        <div key={n.id} style={{
          padding: '8px 0', borderBottom: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: 2
        }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{n.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.body}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.time}</div>
        </div>
      ))}
      <button style={{
        width: '100%', marginTop: 8, background: 'none', border: 'none',
        color: 'var(--blue-light)', fontSize: 12, cursor: 'pointer', fontWeight: 600
      }}>View all notifications</button>
    </div>
  );
}

export default NotificationPanel;
