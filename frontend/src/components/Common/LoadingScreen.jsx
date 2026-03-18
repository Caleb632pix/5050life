import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20
    }}>
      <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 40 }}>
        <span style={{ color: 'var(--red)' }}>50</span>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--blue-light)' }}>50</span>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 22, marginLeft: 8 }}>Life</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i === 1 ? 'var(--blue)' : 'var(--red)',
            animation: 'spin 1s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`
          }} />
        ))}
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1.0)}}`}</style>
    </div>
  );
}
