import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, TrendingUp, Target, Crown } from 'lucide-react';

const PERIODS = ['This Week', 'This Month', 'All Time'];
const CATS    = ['Net Profit', 'Win Rate', 'Total Bets', 'Biggest Win'];

export default function Leaderboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('This Month');
  const [cat, setCat]       = useState('Net Profit');
  const leaders = getMockLeaders();

  const podium = leaders.slice(0, 3);
  const rest   = leaders.slice(3);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ padding: '20px 16px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 28, marginBottom: 16 }}>
          🏆 LEADERBOARD
        </h1>

        {/* Period filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)',
              background: period === p ? 'var(--red)' : 'transparent',
              color: period === p ? 'white' : 'var(--text-muted)',
              fontWeight: 700, fontSize: 12, cursor: 'pointer'
            }}>{p}</button>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)',
              background: cat === c ? 'var(--blue)' : 'transparent',
              color: cat === c ? 'white' : 'var(--text-muted)',
              fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Podium — top 3 */}
      <div style={{ padding: '20px 16px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 8, alignItems: 'flex-end', marginBottom: 20 }}>
          {/* 2nd */}
          <PodiumCard user={podium[1]} rank={2} height={100} />
          {/* 1st */}
          <PodiumCard user={podium[0]} rank={1} height={130} />
          {/* 3rd */}
          <PodiumCard user={podium[2]} rank={3} height={80} />
        </div>
      </div>

      {/* Rest of leaderboard */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rest.map((user, i) => (
          <div key={user.username} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${user.username}`)}>
            <div style={{
              width: 32, fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 18,
              textAlign: 'center', color: 'var(--text-muted)', flexShrink: 0
            }}>#{i + 4}</div>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,var(--red),var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 900, fontFamily: 'var(--font-cond)', fontSize: 16
            }}>{user.username[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>@{user.username}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.totalBets} bets · {user.winRate}% win rate</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 18, color: 'var(--green)' }}>
                +${user.netProfit.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>NET PROFIT</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PodiumCard({ user, rank, height }) {
  const navigate = useNavigate();
  const colors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div onClick={() => navigate(`/profile/${user.username}`)} style={{ cursor: 'pointer', textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{medals[rank]}</div>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', margin: '0 auto 8px',
        background: `linear-gradient(135deg,var(--red),var(--blue))`,
        border: `3px solid ${colors[rank]}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 22
      }}>{user.username[0].toUpperCase()}</div>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>@{user.username}</div>
      <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: rank===1?22:18, color: colors[rank] }}>
        +${user.netProfit.toLocaleString()}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user.winRate}% wins</div>
      <div style={{
        background: `linear-gradient(180deg,${colors[rank]}22,${colors[rank]}44)`,
        border: `1px solid ${colors[rank]}55`, borderRadius: '6px 6px 0 0',
        height, marginTop: 8
      }} />
    </div>
  );
}

function getMockLeaders() {
  return [
    { username:'kingbettor',   netProfit:4820, totalBets:203, winRate:62, biggestWin:850 },
    { username:'pro_tipster',  netProfit:3150, totalBets:167, winRate:58, biggestWin:620 },
    { username:'sharp_line',   netProfit:2740, totalBets:88,  winRate:64, biggestWin:1200 },
    { username:'lucky_ace',    netProfit:1980, totalBets:312, winRate:54, biggestWin:440 },
    { username:'nba_expert',   netProfit:1450, totalBets:145, winRate:56, biggestWin:380 },
    { username:'football_god', netProfit:1200, totalBets:220, winRate:52, biggestWin:290 },
    { username:'cs2_bettor',   netProfit:890,  totalBets:67,  winRate:60, biggestWin:210 },
    { username:'tennis_ace',   netProfit:760,  totalBets:92,  winRate:55, biggestWin:180 },
  ];
}
