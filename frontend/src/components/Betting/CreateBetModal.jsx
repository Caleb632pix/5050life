import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createBet } from '../../store/slices/betSlice';
import { selectBalance } from '../../store/slices/walletSlice';
import { Modal } from '../Common/NotificationPanel';
import toast from 'react-hot-toast';

const SPORTS = [
  { key:'football',   label:'⚽ Football' },
  { key:'cricket',    label:'🏏 Cricket' },
  { key:'basketball', label:'🏀 Basketball' },
  { key:'tennis',     label:'🎾 Tennis' },
  { key:'mma',        label:'🥊 MMA / Boxing' },
  { key:'esports',    label:'🎮 Esports' },
  { key:'golf',       label:'⛳ Golf' },
  { key:'baseball',   label:'⚾ Baseball' },
  { key:'rugby',      label:'🏉 Rugby' },
  { key:'custom',     label:'🎯 Custom Bet' },
];
const COMMISSION = 0.10;

export default function CreateBetModal({ onClose }) {
  const dispatch = useDispatch();
  const balance  = useSelector(selectBalance);
  const { loading, error } = useSelector(s => s.bets);

  const [step, setStep]           = useState(1);
  const [sport, setSport]         = useState('');
  const [eventName, setEvent]     = useState('');
  const [selection, setSelection] = useState('');
  const [odds, setOdds]           = useState('');
  const [stake, setStake]         = useState('');
  const [type, setType]           = useState('p2p');
  const [visibility, setVis]      = useState('public');
  const [description, setDesc]    = useState('');
  const [expiresIn, setExpiry]    = useState('24');

  const stakeNum      = parseFloat(stake) || 0;
  const oddsNum       = parseFloat(odds)  || 0;
  const grossPayout   = stakeNum * oddsNum;
  const commission    = grossPayout * COMMISSION;
  const netPayout     = grossPayout - commission;
  const canAfford     = stakeNum <= parseFloat(balance || 0);
  const isValidStep1  = sport && eventName && selection && odds > 1 && stake >= 1;

  const submit = async () => {
    if (!isValidStep1) return;
    const expires = new Date(Date.now() + parseInt(expiresIn) * 60 * 60 * 1000);
    const result = await dispatch(createBet({
      type, sport, eventName, selection,
      odds: parseFloat(odds), stake: parseFloat(stake),
      visibility, description, expiresAt: expires.toISOString()
    }));
    if (createBet.fulfilled.match(result)) {
      toast.success('Bet created! Your stake is in escrow 🎯');
      onClose();
    } else {
      toast.error(result.payload || 'Failed to create bet');
    }
  };

  return (
    <Modal title="Create a Bet Challenge" onClose={onClose} width={540}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[1,2].map(s => (
          <div key={s} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: step >= s
              ? 'linear-gradient(90deg,var(--red),var(--blue))'
              : 'var(--border)'
          }} />
        ))}
      </div>

      {step === 1 && (
        <div>
          {/* Bet type */}
          <div className="form-group">
            <label className="form-label">Bet Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { key:'p2p', label:'⚔️ P2P', desc:'Challenge a friend or anyone' },
                { key:'sportsbook', label:'📊 Sportsbook', desc:'Bet vs the house odds' },
                { key:'group', label:'👥 Group', desc:'Multi-player room bet' },
              ].map(t => (
                <button key={t.key} onClick={() => setType(t.key)} style={{
                  padding: '10px 8px', borderRadius: 'var(--radius)', cursor: 'pointer',
                  background: type === t.key ? 'var(--red-muted)' : 'var(--bg-input)',
                  border: `2px solid ${type === t.key ? 'var(--red)' : 'var(--border)'}`,
                  textAlign: 'center', transition: 'all 0.15s'
                }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{t.label.split(' ')[0]}</div>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{t.label.split(' ').slice(1).join(' ')}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sport */}
          <div className="form-group">
            <label className="form-label">Sport</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {SPORTS.map(s => (
                <button key={s.key} onClick={() => setSport(s.key)} style={{
                  padding: '8px 4px', border: `1px solid ${sport === s.key ? 'var(--blue)' : 'var(--border)'}`,
                  background: sport === s.key ? 'var(--blue-muted)' : 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  color: sport === s.key ? 'var(--blue-light)' : 'var(--text-secondary)',
                  textAlign: 'center', lineHeight: 1.3
                }}>
                  {s.label.split(' ')[0]}<br/>{s.label.split(' ').slice(1).join(' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Event name */}
          <div className="form-group">
            <label className="form-label">Event / Match</label>
            <input className="form-input" placeholder="e.g. Manchester City vs Arsenal" value={eventName} onChange={e => setEvent(e.target.value)} />
          </div>

          {/* Selection */}
          <div className="form-group">
            <label className="form-label">Your Pick / Selection</label>
            <input className="form-input" placeholder="e.g. Man City Win, Over 2.5, Djokovic ML" value={selection} onChange={e => setSelection(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Odds (Decimal)</label>
              <input className="form-input" type="number" min="1.01" step="0.05" placeholder="e.g. 1.85" value={odds} onChange={e => setOdds(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Stake ($)</label>
              <input className={`form-input ${!canAfford && stake ? 'error' : ''}`} type="number" min="1" max="10000" placeholder="Min $1" value={stake} onChange={e => setStake(e.target.value)} />
              {!canAfford && stake && <span className="form-error">Insufficient balance (${parseFloat(balance).toFixed(2)} available)</span>}
            </div>
          </div>

          <button className="btn btn-split btn-full btn-lg" onClick={() => setStep(2)} disabled={!isValidStep1 || !canAfford}>
            Review Bet →
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <button onClick={() => setStep(1)} style={{ background:'none', border:'none', color:'var(--blue-light)', cursor:'pointer', fontSize:13, marginBottom:16 }}>
            ← Edit
          </button>

          {/* Payout breakdown */}
          <div style={{
            background: 'var(--bg-hover)', borderRadius: 'var(--radius-lg)',
            padding: '16px', marginBottom: 16, border: '1px solid var(--border)'
          }}>
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 16, marginBottom: 12 }}>
              📊 BET SUMMARY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SummaryRow label="Sport / Event" value={`${sport.toUpperCase()} · ${eventName}`} />
              <SummaryRow label="Your Pick"     value={selection} highlight="var(--red)" />
              <SummaryRow label="Odds"          value={`${parseFloat(odds).toFixed(2)}x`} />
              <SummaryRow label="Stake"         value={`$${stakeNum.toFixed(2)}`} />
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
              <SummaryRow label="Gross Payout"  value={`$${grossPayout.toFixed(2)}`} />
              <SummaryRow label="10% Commission"value={`-$${commission.toFixed(2)}`} highlight="var(--error)" />
              <SummaryRow label="🏆 Net Payout" value={`$${netPayout.toFixed(2)}`} highlight="var(--green)" bold />
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Visibility</label>
              <select className="form-input" value={visibility} onChange={e => setVis(e.target.value)}>
                <option value="public">🌍 Public</option>
                <option value="followers">👥 Followers only</option>
                <option value="private">🔒 Private link</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Expires In</label>
              <select className="form-input" value={expiresIn} onChange={e => setExpiry(e.target.value)}>
                <option value="6">6 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="168">7 days</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Add a message (optional)</label>
            <textarea className="form-input" rows={2} placeholder="Talk your shot 🎯" value={description} onChange={e => setDesc(e.target.value)} style={{ resize: 'none' }} />
          </div>

          <div style={{ background: 'rgba(245,124,0,0.1)', border: '1px solid rgba(245,124,0,0.3)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 14, fontSize: 12, color: 'var(--amber)' }}>
            ⚠️ <strong>${ stakeNum.toFixed(2)}</strong> will be locked in escrow until this bet is settled. 10% platform commission deducted from winnings.
          </div>

          {error && <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 10 }}>{error}</div>}

          <button className="btn btn-split btn-full btn-lg" onClick={submit} disabled={loading}>
            {loading ? '⏳ Placing Bet…' : `🎯 Place Bet — Stake $${stakeNum.toFixed(2)}`}
          </button>
        </div>
      )}
    </Modal>
  );
}

function SummaryRow({ label, value, highlight, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: bold ? 16 : 13, fontWeight: bold ? 900 : 700, color: highlight || 'var(--text-primary)', fontFamily: bold ? 'var(--font-cond)' : 'var(--font)' }}>{value}</span>
    </div>
  );
}
