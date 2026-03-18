import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Filter, Plus, Zap, TrendingUp } from 'lucide-react';
import { fetchBets, setFilters } from '../store/slices/betSlice';
import BetCard from '../components/Betting/BetCard';
import CreateBetModal from '../components/Betting/CreateBetModal';
import { SportBadge } from '../components/Common/NotificationPanel';

const SPORTS = ['All','Football','Cricket','Basketball','Tennis','MMA','Esports','Golf','Baseball'];
const TYPES  = ['All','P2P','Sportsbook','Group'];
const SORTS  = [{ value: 'newest', label: 'Newest' }, { value: 'highest_stake', label: 'Biggest Stake' }, { value: 'lowest_stake', label: 'Smallest Stake' }];

export default function Betting() {
  const dispatch = useDispatch();
  const { publicBets, loading, filters, pagination } = useSelector(s => s.bets);
  const [showCreate, setCreate] = useState(false);
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState('newest');
  const [liveOdds, setLiveOdds] = useState(getMockOdds());

  useEffect(() => { dispatch(fetchBets({ ...filters, sort })); }, [dispatch, filters, sort]);

  const handleSportFilter = (sport) => {
    dispatch(setFilters({ sport: sport === 'All' ? '' : sport.toLowerCase() }));
  };
  const handleTypeFilter = (type) => {
    dispatch(setFilters({ type: type === 'All' ? '' : type.toLowerCase() }));
  };

  const bets = publicBets.length > 0 ? publicBets : getMockBets();

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)',
        borderBottom: '1px solid var(--border)', padding: '14px 16px 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 22 }}>🎯 BETTING</h1>
          <button className="btn btn-split" onClick={() => setCreate(true)}>
            <Plus size={15} /> New Bet
          </button>
        </div>

        {/* Sport filter */}
        <div style={{ overflowX: 'auto', display: 'flex', gap: 6, paddingBottom: 12, scrollbarWidth: 'none' }}>
          {SPORTS.map(s => (
            <button key={s} onClick={() => handleSportFilter(s)} style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: (filters.sport || 'All') === (s === 'All' ? 'All' : s.toLowerCase())
                ? 'var(--red)' : 'var(--bg-card)',
              color: (filters.sport || 'All') === (s === 'All' ? 'All' : s.toLowerCase())
                ? 'white' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: 12, flexShrink: 0, whiteSpace: 'nowrap',
              border: '1px solid var(--border)'
            }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8 }}>
        {/* Search */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search bets, events…"
            style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="form-input" style={{ height: 36, fontSize: 13, width: 'auto' }}>
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Live odds ticker */}
      <LiveOddsTicker odds={liveOdds} />

      {/* Commission notice */}
      <div style={{
        margin: '10px 16px 0', padding: '8px 12px', borderRadius: 'var(--radius)',
        background: 'linear-gradient(135deg,var(--red-muted),var(--blue-muted))',
        fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6
      }}>
        <Zap size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} />
        <span><strong style={{ color: 'var(--text-primary)' }}>50/50 Life</strong> takes 10% commission from all winning payouts. Net payout shown after deduction.</span>
      </div>

      {/* Bet type filter */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}>
        {TYPES.map(t => (
          <button key={t} onClick={() => handleTypeFilter(t)} style={{
            padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', cursor: 'pointer',
            background: (filters.type || 'All') === (t === 'All' ? 'All' : t.toLowerCase())
              ? 'var(--blue)' : 'transparent',
            color: (filters.type || 'All') === (t === 'All' ? 'All' : t.toLowerCase())
              ? 'white' : 'var(--text-muted)',
            fontWeight: 700, fontSize: 12
          }}>{t}</button>
        ))}
      </div>

      {/* Bets grid */}
      <div style={{ padding: '12px 16px 80px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && bets.length === 0
          ? Array(4).fill(0).map((_, i) => <BetSkeleton key={i} />)
          : bets
              .filter(b => !search || b.eventName?.toLowerCase().includes(search.toLowerCase()))
              .map(bet => <BetCard key={bet.id || bet._id} bet={bet} />)
        }
        {!loading && bets.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <TrendingUp size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 18 }}>No bets found</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Be the first to create a bet challenge</div>
          </div>
        )}
      </div>

      {showCreate && <CreateBetModal onClose={() => setCreate(false)} />}
    </div>
  );
}

function LiveOddsTicker({ odds }) {
  return (
    <div style={{
      margin: '12px 0 0', padding: '8px 0', borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
      overflow: 'hidden', position: 'relative'
    }}>
      <div style={{
        display: 'flex', gap: 24, animation: 'scroll 30s linear infinite',
        whiteSpace: 'nowrap', paddingLeft: '100%'
      }}>
        {[...odds, ...odds].map((o, i) => (
          <span key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{o.event}</span>
            {' '}<span style={{ color: 'var(--amber)', fontFamily: 'var(--font-cond)', fontWeight: 900 }}>{o.odds}</span>
            {' '}<span style={{ color: o.change > 0 ? 'var(--green)' : 'var(--error)', fontSize: 10 }}>
              {o.change > 0 ? '▲' : '▼'}{Math.abs(o.change).toFixed(2)}
            </span>
          </span>
        ))}
      </div>
      <style>{`@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

function BetSkeleton() {
  return (
    <div className="card">
      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="skeleton" style={{ height: 40, flex: 1 }} />
        <div className="skeleton" style={{ height: 40, flex: 1 }} />
        <div className="skeleton" style={{ height: 40, flex: 1 }} />
      </div>
    </div>
  );
}

function getMockBets() {
  return [
    { id:'1', type:'p2p', sport:'football', eventName:'Manchester City vs Arsenal', selection:'Man City Win', odds:1.85, stake:50, status:'open', creator:{ username:'kingbettor' }, commissionAmount:9.25, netPayout:83.25, visibility:'public' },
    { id:'2', type:'p2p', sport:'basketball', eventName:'Lakers vs Warriors', selection:'Over 224.5', odds:1.90, stake:100, status:'open', creator:{ username:'nba_sharp' }, commissionAmount:19, netPayout:171, visibility:'public' },
    { id:'3', type:'p2p', sport:'esports', eventName:'NaVi vs Astralis — CS2', selection:'NaVi Win', odds:1.70, stake:30, status:'matched', creator:{ username:'cs2_expert' }, commissionAmount:5.10, netPayout:45.90, visibility:'public' },
    { id:'4', type:'sportsbook', sport:'tennis', eventName:'Djokovic vs Alcaraz — US Open', selection:'Djokovic Win', odds:1.45, stake:200, status:'open', creator:{ username:'tennis_ace' }, commissionAmount:29, netPayout:261, visibility:'public' },
    { id:'5', type:'p2p', sport:'cricket', eventName:'India vs England — T20', selection:'India Win', odds:1.60, stake:75, status:'open', creator:{ username:'ipl_fan99' }, commissionAmount:9, netPayout:111, visibility:'public' },
  ];
}
function getMockOdds() {
  return [
    { event: 'Man City vs Arsenal', odds: '1.85', change: 0.05 },
    { event: 'Lakers vs Warriors O224.5', odds: '1.90', change: -0.03 },
    { event: 'NaVi vs Astralis', odds: '1.70', change: 0.10 },
    { event: 'Djokovic ML', odds: '1.45', change: -0.08 },
    { event: 'India T20', odds: '1.60', change: 0.02 },
  ];
}
