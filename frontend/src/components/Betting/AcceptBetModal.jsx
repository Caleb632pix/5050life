import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { acceptBet } from '../../store/slices/betSlice';
import { selectBalance } from '../../store/slices/walletSlice';
import { Modal } from '../Common/NotificationPanel';
import toast from 'react-hot-toast';

export default function AcceptBetModal({ bet, onClose }) {
  const dispatch = useDispatch();
  const balance  = useSelector(selectBalance);
  const { loading } = useSelector(s => s.bets);
  const [selection, setSelection] = useState('');

  const stake      = parseFloat(bet.stake);
  const netPayout  = stake * parseFloat(bet.odds) * 0.90;
  const commission = stake * parseFloat(bet.odds) * 0.10;
  const canAfford  = stake <= parseFloat(balance || 0);

  const submit = async () => {
    if (!selection.trim()) { toast.error('Enter your pick to accept'); return; }
    const result = await dispatch(acceptBet({ betId: bet.id, selection }));
    if (acceptBet.fulfilled.match(result)) {
      toast.success("Bet accepted! It's on 🔥");
      onClose();
    } else {
      toast.error(result.payload || 'Failed to accept');
    }
  };

  return (
    <Modal title="⚔️ Accept Bet Challenge" onClose={onClose} width={480}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 20, marginBottom: 6 }}>
          {bet.eventName}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{bet.market || bet.sport}</div>
      </div>

      {/* Sides */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ background:'var(--red-muted)', border:'1px solid rgba(204,0,0,0.3)', borderRadius:'var(--radius)', padding:'12px', textAlign:'center' }}>
          <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, marginBottom:4 }}>THEIR PICK</div>
          <div style={{ fontWeight:800, color:'var(--red)', fontSize:14 }}>{bet.selection}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>@{bet.creator?.username}</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div className="odds-display" style={{ fontSize:26 }}>{parseFloat(bet.odds).toFixed(2)}</div>
          <div style={{ fontSize:10, color:'var(--text-muted)' }}>ODDS</div>
        </div>
        <div style={{ background:'var(--blue-muted)', border:'1px solid rgba(0,51,204,0.3)', borderRadius:'var(--radius)', padding:'12px', textAlign:'center' }}>
          <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, marginBottom:4 }}>YOUR PICK</div>
          <input
            className="form-input"
            placeholder="Enter your pick…"
            value={selection}
            onChange={e => setSelection(e.target.value)}
            style={{ textAlign:'center', fontWeight:800, color:'var(--blue-light)', background:'transparent', border:'none', padding:0, fontSize:14 }}
          />
        </div>
      </div>

      {/* Financials */}
      <div style={{ background:'var(--bg-hover)', borderRadius:'var(--radius)', padding:'14px', marginBottom:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <Row label="Required stake"   value={`$${stake.toFixed(2)}`} />
          <Row label="Gross payout"     value={`$${(stake*bet.odds).toFixed(2)}`} />
          <Row label="10% commission"   value={`-$${commission.toFixed(2)}`} color="var(--error)" />
          <hr style={{ border:'none', borderTop:'1px solid var(--border)' }} />
          <Row label="🏆 Your net win"  value={`$${netPayout.toFixed(2)}`}  color="var(--green)" bold />
          <Row label="Wallet balance"   value={`$${parseFloat(balance).toFixed(2)}`} color={canAfford ? 'var(--green)' : 'var(--error)'} />
        </div>
      </div>

      {!canAfford && (
        <div style={{ background:'rgba(204,0,0,0.1)', border:'1px solid var(--red)', borderRadius:'var(--radius)', padding:'10px 12px', fontSize:13, color:'var(--error)', marginBottom:12 }}>
          ⚠️ Insufficient balance. <a href="/wallet" style={{ color:'var(--red)', fontWeight:700 }}>Deposit funds</a> to accept this bet.
        </div>
      )}

      <button className="btn btn-split btn-full btn-lg" onClick={submit} disabled={loading || !canAfford || !selection.trim()}>
        {loading ? 'Accepting…' : `⚔️ Accept — Lock in $${stake.toFixed(2)}`}
      </button>
      <p style={{ textAlign:'center', fontSize:11, color:'var(--text-muted)', marginTop:10 }}>
        Stake locked in escrow until event settles. 10% commission deducted from winnings only.
      </p>
    </Modal>
  );
}

function Row({ label, value, color, bold }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between' }}>
      <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize:bold?15:13, fontWeight:bold?900:700, color:color||'var(--text-primary)', fontFamily:bold?'var(--font-cond)':'var(--font)' }}>{value}</span>
    </div>
  );
}
