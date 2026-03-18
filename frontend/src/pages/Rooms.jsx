import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Lock, Trophy, Clock, Zap, Target } from 'lucide-react';
import { Modal } from '../components/Common/NotificationPanel';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Rooms() {
  const navigate   = useNavigate();
  const [rooms, setRooms]       = useState(getMockRooms());
  const [tab, setTab]           = useState('browse');
  const [showCreate, setCreate] = useState(false);
  const [showJoin, setJoin]     = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const myRooms    = rooms.filter(r => r.isJoined);
  const openRooms  = rooms.filter(r => !r.isJoined && r.status === 'open');

  const handleJoinRoom = async (roomId) => {
    try {
      await api.post(`/rooms/${roomId}/join`).catch(() => {});
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, isJoined: true, currentParticipants: r.currentParticipants + 1 } : r));
      toast.success('Joined room!');
    } catch { toast.error('Failed to join room'); }
  };

  const handleJoinByCode = () => {
    const room = rooms.find(r => r.inviteCode === joinCode.toUpperCase());
    if (room) { handleJoinRoom(room.id); setJoin(false); setJoinCode(''); }
    else toast.error('Invalid invite code');
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        position:'sticky', top:0, zIndex:10, background:'var(--bg)',
        borderBottom:'1px solid var(--border)', padding:'14px 16px 0'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:22 }}>👥 BETTING ROOMS</h1>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setJoin(true)}>🔑 Join by Code</button>
            <button className="btn btn-split btn-sm" onClick={() => setCreate(true)}><Plus size={14} /> Create Room</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {['browse','my-rooms'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'8px 16px', border:'none', background:'none', cursor:'pointer',
              fontWeight:700, fontSize:13,
              color: tab===t ? 'var(--red)' : 'var(--text-muted)',
              borderBottom: tab===t ? '2px solid var(--red)' : '2px solid transparent'
            }}>{t === 'browse' ? 'Browse Rooms' : `My Rooms (${myRooms.length})`}</button>
          ))}
        </div>
      </div>

      {/* Featured room */}
      {tab === 'browse' && (
        <div style={{ padding:'16px 16px 0' }}>
          <div style={{
            background:'linear-gradient(135deg,#1a0000 0%,#000d33 100%)',
            border:'1px solid var(--border)', borderRadius:'var(--radius-xl)',
            padding:20, marginBottom:16, position:'relative', overflow:'hidden'
          }}>
            <div style={{
              position:'absolute', top:'-20%', right:'-5%', fontSize:100, opacity:0.05,
              fontFamily:'var(--font-cond)', fontWeight:900
            }}>50/50</div>
            <div className="badge badge-live" style={{ marginBottom:10 }}>🔥 FEATURED</div>
            <h2 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:22, marginBottom:8 }}>
              Champions League Final Prediction Room
            </h2>
            <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:14 }}>
              Pick the winner. £10 entry. Winner takes 90% of the prize pool.
            </div>
            <div style={{ display:'flex', gap:16, marginBottom:16 }}>
              <div><div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:24, color:'var(--amber)' }}>$2,340</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>Prize Pool</div></div>
              <div><div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:24 }}>234</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>Players</div></div>
              <div><div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:24, color:'var(--red)' }}>2d 14h</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>Time Left</div></div>
            </div>
            <button className="btn btn-split" onClick={() => navigate('/rooms/featured')}>
              ⚽ Join for $10 Entry
            </button>
          </div>
        </div>
      )}

      {/* Room list */}
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:10, marginTop:tab==='my-rooms'?16:0 }}>
        {(tab === 'browse' ? openRooms : myRooms).map(room => (
          <RoomCard key={room.id} room={room} onJoin={handleJoinRoom} onClick={() => navigate(`/rooms/${room.id}`)} />
        ))}
        {(tab === 'my-rooms' ? myRooms : openRooms).length === 0 && (
          <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text-muted)' }}>
            <Users size={48} style={{ opacity:0.2, marginBottom:12 }} />
            <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18, marginBottom:8 }}>
              {tab === 'my-rooms' ? 'No rooms joined yet' : 'No open rooms'}
            </div>
            <button className="btn btn-red" onClick={() => tab==='my-rooms' ? setTab('browse') : setCreate(true)}>
              {tab === 'my-rooms' ? 'Browse Rooms' : 'Create a Room'}
            </button>
          </div>
        )}
      </div>

      {showCreate && <CreateRoomModal onClose={() => setCreate(false)} onCreate={r => setRooms(prev => [r, ...prev])} />}
      {showJoin && (
        <Modal title="🔑 Join by Invite Code" onClose={() => setJoin(false)} width={400}>
          <div className="form-group">
            <label className="form-label">Invite Code</label>
            <input className="form-input" placeholder="e.g. AB3X7K9P2Q" value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())} style={{ letterSpacing:'0.15em', fontWeight:700, fontSize:16 }} />
          </div>
          <button className="btn btn-blue btn-full" onClick={handleJoinByCode}>Join Room</button>
        </Modal>
      )}
    </div>
  );
}

function RoomCard({ room, onJoin, onClick }) {
  const pct = (room.currentParticipants / room.maxParticipants) * 100;
  return (
    <div className="card card-hover" onClick={onClick} style={{ cursor:'pointer' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>{room.name}</span>
            {room.isPrivate && <Lock size={12} style={{ color:'var(--text-muted)' }} />}
          </div>
          {room.sport && <span className="sport-badge">{room.sport}</span>}
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:20, color:'var(--amber)' }}>
            ${parseFloat(room.netPrizePool || 0).toFixed(0)}
          </div>
          <div style={{ fontSize:10, color:'var(--text-muted)' }}>NET PRIZE (after 10%)</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:16, marginBottom:10, fontSize:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-secondary)' }}>
          <Users size={12} /> {room.currentParticipants}/{room.maxParticipants} players
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-secondary)' }}>
          <Trophy size={12} /> {room.payoutType?.replace('_',' ')}
        </div>
        {room.entryFee > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--amber)' }}>
            <Zap size={12} /> ${room.entryFee} entry
          </div>
        )}
        {room.endsAt && (
          <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-muted)' }}>
            <Clock size={12} /> Ends {new Date(room.endsAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Capacity bar */}
      <div style={{ height:4, background:'var(--border)', borderRadius:2, marginBottom:12, overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:2, width:`${pct}%`,
          background: pct > 80 ? 'var(--red)' : pct > 50 ? 'var(--amber)' : 'var(--green)',
          transition:'width 0.3s'
        }} />
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <button className="btn btn-ghost btn-sm" style={{ flex:1 }}>View Room</button>
        {!room.isJoined && (
          <button className="btn btn-blue btn-sm" style={{ flex:1 }} onClick={e => { e.stopPropagation(); onJoin(room.id); }}>
            Join {room.entryFee > 0 ? `($${room.entryFee})` : 'Free'}
          </button>
        )}
        {room.isJoined && <span className="badge badge-open" style={{ padding:'6px 14px' }}>✓ Joined</span>}
      </div>
    </div>
  );
}

function CreateRoomModal({ onClose, onCreate }) {
  const [name, setName]     = useState('');
  const [sport, setSport]   = useState('football');
  const [fee, setFee]       = useState('');
  const [max, setMax]       = useState('50');
  const [payout, setPayout] = useState('winner_takes_all');
  const [priv, setPriv]     = useState(false);
  const [loading, setLoading] = useState(false);

  const entryFee   = parseFloat(fee) || 0;
  const maxPlayers = parseInt(max) || 50;
  const grossPool  = entryFee * maxPlayers;
  const commission = grossPool * 0.10;
  const netPool    = grossPool - commission;

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/rooms', { name, sport, entryFee, maxParticipants: maxPlayers, payoutType: payout, isPrivate: priv }).catch(() => ({ data: { data: { room: { id: Date.now(), name, sport, entryFee, maxParticipants: maxPlayers, currentParticipants: 1, netPrizePool: netPool, payoutType: payout, isPrivate: priv, status:'open', inviteCode: Math.random().toString(36).slice(2,10).toUpperCase(), isJoined: true } } } }));
      onCreate(data.data.room);
      toast.success(`Room "${name}" created!`);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <Modal title="🏟️ Create Betting Room" onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Room Name</label>
        <input className="form-input" placeholder="e.g. Premier League Predictor" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="form-group">
          <label className="form-label">Sport</label>
          <select className="form-input" value={sport} onChange={e => setSport(e.target.value)}>
            {['football','cricket','basketball','tennis','esports','mma','golf','custom'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Max Players</label>
          <input className="form-input" type="number" min="2" max="500" value={max} onChange={e => setMax(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Entry Fee ($)</label>
          <input className="form-input" type="number" min="0" placeholder="0 = Free" value={fee} onChange={e => setFee(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Payout Type</label>
          <select className="form-input" value={payout} onChange={e => setPayout(e.target.value)}>
            <option value="winner_takes_all">Winner Takes All</option>
            <option value="top3">Top 3 Share</option>
            <option value="proportional">Proportional</option>
          </select>
        </div>
      </div>

      {entryFee > 0 && (
        <div style={{ background:'var(--bg-hover)', borderRadius:'var(--radius)', padding:12, marginBottom:14, fontSize:12 }}>
          <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:14, marginBottom:8 }}>Prize Pool Preview</div>
          <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--text-muted)' }}>Full entry pool</span><span>${grossPool.toFixed(2)}</span></div>
          <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--text-muted)' }}>50/50 Life (10%)</span><span style={{ color:'var(--error)' }}>-${commission.toFixed(2)}</span></div>
          <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700 }}><span>Net prize pool</span><span style={{ color:'var(--green)' }}>${netPool.toFixed(2)}</span></div>
        </div>
      )}

      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:14, fontSize:13 }}>
        <input type="checkbox" checked={priv} onChange={e => setPriv(e.target.checked)} />
        <span>Private room (invite code only)</span>
      </label>

      <button className="btn btn-split btn-full btn-lg" onClick={submit} disabled={loading || !name.trim()}>
        {loading ? 'Creating…' : '🏟️ Create Room'}
      </button>
    </Modal>
  );
}

function getMockRooms() {
  return [
    { id:'r1', name:'PL Top 4 Challenge', sport:'football', entryFee:10, maxParticipants:100, currentParticipants:67, netPrizePool:603, payoutType:'top3', status:'open', isJoined:false, endsAt:'2026-05-20' },
    { id:'r2', name:'NBA Finals Predictor', sport:'basketball', entryFee:25, maxParticipants:50, currentParticipants:38, netPrizePool:855, payoutType:'winner_takes_all', status:'open', isJoined:true, endsAt:'2026-06-15' },
    { id:'r3', name:'Free Cricket Comp', sport:'cricket', entryFee:0, maxParticipants:200, currentParticipants:134, netPrizePool:0, payoutType:'proportional', status:'open', isJoined:false },
    { id:'r4', name:'CS2 Major Picks', sport:'esports', entryFee:5, maxParticipants:75, currentParticipants:75, netPrizePool:337.50, payoutType:'winner_takes_all', status:'active', isJoined:false },
    { id:'r5', name:'Our Sunday League 🍺', sport:'football', isPrivate:true, entryFee:20, maxParticipants:12, currentParticipants:8, netPrizePool:144, payoutType:'winner_takes_all', status:'open', isJoined:true, inviteCode:'SUNDAY20' },
  ];
}
