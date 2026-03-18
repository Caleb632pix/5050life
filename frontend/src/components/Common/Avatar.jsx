// ── Avatar ───────────────────────────────────────────────────────────────────
import React from 'react';

export default function Avatar({ user, size = 40 }) {
  const initials = user
    ? (user.firstName?.[0] || user.username?.[0] || '?').toUpperCase()
    : '?';
  const sizeStyle = { width: size, height: size, fontSize: size * 0.4, borderRadius: '50%', flexShrink: 0 };

  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.username} style={{ ...sizeStyle, objectFit: 'cover' }} />;
  }
  return (
    <div style={{
      ...sizeStyle,
      background: 'linear-gradient(135deg,var(--red),var(--blue))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 900, fontFamily: 'var(--font-cond)'
    }}>
      {initials}
    </div>
  );
}
