import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Clock, User, TrendingUp, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { BetBadge, SportBadge } from '../Common/NotificationPanel';
import AcceptBetModal from './AcceptBetModal';
import { selectUser } from '../../store/slices/authSlice';

export default function BetCard({ bet }) {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [showAccept, setAccept] = useState(false);

  const isOwn    = user?.id === bet.creatorId;
  const canAccept = bet.status === 'open' && !isOwn;
  const commission = parseFloat(bet.commissionAmount || bet.stake * bet.odds * 0.10);
  const netPayout  = parseFloat(bet.netPayout || (bet.stake * bet.odds * 0.90));

  return (
    <>
      <div className="bet-card" onClick={() => navigate(`/betting/${bet.id}`)}
        style={{ cursor: 'pointer' }}>

        {/* Header */}
        <div className="bet-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
              <SportBadge sport={bet.sport} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                {bet.type}
              </span>
              {bet.status === 'matched' && <span className="badge badge-live" style={{ fontSize: 10 }}>● LIVE</span>}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginBottom: 2 }}>
              {bet.eventName}
            </div>
            {bet.market && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bet.market}</div>
            )}
          </div>
          <BetBadge status={bet.status} result={bet.result} />
        </div>

        {/* Body — the bet itself */}
        <div className="bet-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
            {/* Creator's pick */}
            <div style={{
              background: 'var(--red-muted)', border: '1px solid rgba(204,0,0,0.25)',
              borderRadius: 'var(--radius)', padding: '10px 12px'
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700 }}>
                {isOwn ? '🔴 YOUR PICK' : '🔴 THEIR PICK'}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--red)', lineHeight: 1.2 }}>
                {bet.selection}
              </div>
            </div>

            {/* VS + odds */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>VS</div>
              <div className="odds-display" style={{ fontSize: 22 }}>{parseFloat(bet.odds).toFixed(2)}</div>
            </div>

            {/* Other side */}
            <div style={{
              background: 'var(--blue-muted)', border: '1px solid rgba(0,51,204,0.25)',
              borderRadius: 'var(--radius)', padding: '10px 12px', textAlign: 'right'
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 700 }}>
                {bet.status === 'matched' ? '🔵 ACCEPTED' : '🔵 OPEN SIDE'}
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--blue-light)', lineHeight: 1.2 }}>
                {bet.status === 'matched' ? 'Matched!' : 'Take the other side'}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <StatChip icon={<TrendingUp size={12} />} label="Stake" value={`$${parseFloat(bet.stake).toFixed(2)}`} color="var(--text-primary)" />
            <StatChip label="Gross Payout" value={`$${(bet.stake * bet.odds).toFixed(2)}`} color="var(--amber)" />
            <StatChip icon={<Shield size={12} />} label="Commission (10%)" value={`-$${commission.toFixed(2)}`} color="var(--error)" />
            <StatChip label="Net Payout" value={`$${netPayout.toFixed(2)}`} color="var(--green)" bold />
          </div>
        </div>

        {/* Footer */}
        <div className="bet-card-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,var(--red),var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 11, fontWeight: 900
            }}>
              {(bet.creator?.username || 'U')[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              @{bet.creator?.username || 'unknown'}
            </span>
            {bet.createdAt && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                · {formatDistanceToNow(new Date(bet.createdAt), { addSuffix: true })}
              </span>
            )}
          </div>

          {canAccept && (
            <button
              className="btn btn-blue btn-sm"
              onClick={e => { e.stopPropagation(); setAccept(true); }}
            >
              ⚔️ Accept
            </button>
          )}
          {isOwn && bet.status === 'open' && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Waiting for opponent…</span>
          )}
        </div>
      </div>

      {showAccept && (
        <AcceptBetModal bet={bet} onClose={() => setAccept(false)} />
      )}
    </>
  );
}

function StatChip({ icon, label, value, color, bold }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 2 }}>
        {icon}{label}
      </div>
      <div style={{ fontWeight: bold ? 900 : 700, fontSize: bold ? 14 : 13, color, fontFamily: bold ? 'var(--font-cond)' : 'var(--font)' }}>
        {value}
      </div>
    </div>
  );
                            }
            
