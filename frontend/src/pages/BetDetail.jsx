// BetDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Flag } from 'lucide-react';
import { BetBadge, SportBadge } from '../components/Common/NotificationPanel';
import AcceptBetModal from '../components/Betting/AcceptBetModal';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import api from '../services/api';

export default function BetDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const user     = useSelector(selectUser);
  const [bet, setBet]         = useState(null);
  const [showAccept, setAccept] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bets/${id}`)
      .then(r => setBet(r.data.data.bet))
      .catch(() => setBet(getMockBet(id)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner lg" /></div>;
  if (!bet)    return <div style={{ textAlign:'center', padding:80, color:'var(--text-muted)' }}>Bet not found</div>;

  const isOwn     = user?.id === bet.creatorId;
  const canAccept = bet.status === 'open' && !isOwn;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 80px' }}>
      <div style={{ padding: '16px 16px 0', display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
          <ChevronLeft size={22} />
        </button>
        <h1 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:20, flex:1 }}>Bet Details</h1>
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><Share2 size:18 /></button>
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><Flag size={18} /></button>
      </div>

      <div style={{ padding:'0 16px' }}>
        {/* Hero */}
        <div style={{
          background:'linear-gradient(135deg,#1a0000,#000d33)',
          borderRadius:'var(--radius-xl)', padding:20, marginBottom:16,
          border:'1px solid var(--border)'
        }}>
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            <SportBadge sport={bet.sport} />
            <BetBadge status={bet.status} result={bet.result} />
          </div>
          <h2 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:22, marginBottom:6 }}>{bet.eventName}</h2>
          {bet.market && <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{bet.market}</div>}
        </div>

        {/* Pick vs Pick */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, alignItems:'center', marginBottom:16 }}>
          <div style={{ background:'var(--red-muted)', border:'1px solid rgba(204,0,0,0.3)', borderRadius:'var(--radius-lg)', padding:16, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, marginBottom:6 }}>CREATOR'S PICK</div>
            <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:20, color:'var(--red)', lineHeight:1.2 }}>{bet.selection}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>@{bet.creator?.username}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div className="odds-display" style={{ fontSize:30 }}>{parseFloat(bet.odds).toFixed(2)}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)' }}>ODDS</div>
          </div>
          <div style={{ background:'var(--blue-muted)', border:'1px solid rgba(0,51,204,0.3)', borderRadius:'var(--radius-lg)', padding:16, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700, marginBottom:6 }}>OTHER SIDE</div>
            <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18, color:'var(--blue-light)' }}>
              {bet.status === 'matched' ? '✅ Matched' : 'Open'}
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:15, marginBottom:12 }}>💰 PAYOUT BREAKDOWN</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { label:'Stake', value:`$${parseFloat(bet.stake).toFixed(2)}` },
              { label:'Gross Payout', value:`$${(bet.stake * bet.odds).toFixed(2)}` },
              { label:'50/50 Life Commission (10%)', value:`-$${(bet.stake * bet.odds * 0.10).toFixed(2)}`, color:'var(--error)' },
              { label:'🏆 Net Payout', value:`$${(bet.stake * bet.odds * 0.90).toFixed(2)}`, color:'var(--green)', bold:true },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', justifyContent:'space-between', paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontWeight:row.bold?900:700, fontSize:row.bold?16:13, color:row.color||'var(--text-primary)', fontFamily:row.bold?'var(--font-cond)':'var(--font)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {canAccept && (
          <button className="btn btn-split btn-full btn-lg" onClick={() => setAccept(true)}>
            ⚔️ Accept This Bet
          </button>
        )}
      </div>

      {showAccept && <AcceptBetModal bet={bet} onClose={() => setAccept(false)} />}
    </div>
  );
}

function getMockBet(id) {
  return { id, sport:'football', eventName:'Man City vs Arsenal', selection:'Man City Win', odds:1.85, stake:50, status:'open', result:null, creator:{ username:'kingbettor' }, market:'Match Winner' };
}
