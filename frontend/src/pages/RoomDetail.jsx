import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Trophy, Send, MessageSquare } from 'lucide-react';
import { BetBadge } from '../components/Common/NotificationPanel';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function RoomDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [room, setRoom]     = useState(null);
  const [tab, setTab]       = useState('leaderboard');
  const [messages, setMsgs] = useState([]);
  const [msg, setMsg]       = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    setRoom(getMockRoom(id));
    setMsgs(getMockRoomChat());
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const sendMsg = () => {
    if (!msg.trim()) return;
    setMsgs(prev => [...prev, { id: Date.now(), username:'me', content:msg, createdAt:new Date() }]);
    setMsg('');
  };

  if (!room) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner lg" /></div>;

  return (
    <div style={{ maxWidth:680, margin:'0 auto', height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-card)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <button onClick={() => navigate('/rooms')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18 }}>{room.name}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:10 }}>
              <span><Users size={11} style={{ marginRight:3 }} />{room.currentParticipants} players</span>
              <span><Trophy size={11} style={{ marginRight:3 }} />${room.netPrizePool} net prize</span>
            </div>
          </div>
          <BetBadge status={room.status} />
        </div>

        <div style={{ display:'flex', gap:4 }}>
          {['leaderboard','bets','chat'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'6px 16px', border:'none', background:'none', cursor:'pointer',
              fontWeight:700, fontSize:12, textTransform:'uppercase',
              color: tab===t ? 'var(--red)' : 'var(--text-muted)',
              borderBottom: tab===t ? '2px solid var(--red)' : '2px solid transparent'
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto' }}>
        {tab === 'leaderboard' && (
          <div style={{ padding:'16px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {room.leaderboard.map((p, i) => (
                <div key={p.username} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'12px',
                  background: i === 0 ? 'linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,215,0,0.05))' : 'var(--bg-card)',
                  border:`1px solid ${i===0?'rgba(255,215,0,0.3)':'var(--border)'}`, borderRadius:'var(--radius)'
                }}>
                  <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:22, width:28, textAlign:'center',
                    color: i===0?'#FFD700':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--text-muted)' }}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                  </div>
                  <div style={{
                    width:40, height:40, borderRadius:'50%', flexShrink:0,
                    background:'linear-gradient(135deg,var(--red),var(--blue))',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'white', fontWeight:900, fontFamily:'var(--font-cond)', fontSize:16
                  }}>{p.username[0].toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700 }}>@{p.username}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>Pick: {p.selection}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18, color: i===0?'#FFD700':'var(--text-primary)' }}>
                      {p.points} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'bets' && (
          <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
            {room.bets.map(bet => (
              <div key={bet.id} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{bet.eventName}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{bet.selection} @ {bet.odds}</div>
                  </div>
                  <BetBadge status={bet.status} result={bet.result} />
                </div>
                <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text-secondary)' }}>
                  <span>Stake: <strong>${bet.stake}</strong></span>
                  <span>Net payout: <strong style={{ color:'var(--green)' }}>${(bet.stake*bet.odds*0.90).toFixed(2)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'chat' && (
          <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            <div style={{ flex:1, overflow:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
              {messages.map(m => (
                <div key={m.id} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                  <div style={{
                    width:28, height:28, borderRadius:'50%', flexShrink:0,
                    background:'linear-gradient(135deg,var(--red),var(--blue))',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'white', fontSize:11, fontWeight:900
                  }}>{m.username[0].toUpperCase()}</div>
                  <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'8px 12px', maxWidth:'80%' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--blue-light)', marginBottom:2 }}>@{m.username}</div>
                    <div style={{ fontSize:13 }}>{m.content}</div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg-card)', display:'flex', gap:8 }}>
              <input className="form-input" style={{ flex:1 }} placeholder="Chat with the room…" value={msg}
                onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMsg()} />
              <button className="btn btn-red" onClick={sendMsg} disabled={!msg.trim()} style={{ padding:'10px 14px' }}>
                <Send size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getMockRoom(id) {
  return {
    id, name:'PL Top 4 Challenge', sport:'football', status:'active',
    currentParticipants:67, maxParticipants:100, netPrizePool:603,
    entryFee:10, payoutType:'top3',
    leaderboard:[
      { username:'kingbettor',  selection:'Man City',  points:42 },
      { username:'pro_tipster', selection:'Arsenal',   points:38 },
      { username:'lucky_ace',   selection:'Liverpool', points:35 },
      { username:'you',         selection:'Man City',  points:33 },
      { username:'nba_sharp',   selection:'Chelsea',   points:28 },
    ],
    bets:[
      { id:'rb1', eventName:'Man City vs Arsenal', selection:'Man City Win', odds:1.85, stake:10, status:'settled', result:'win' },
      { id:'rb2', eventName:'Liverpool vs Chelsea', selection:'Liverpool Win', odds:1.70, stake:10, status:'open', result:null },
    ]
  };
}

function getMockRoomChat() {
  return [
    { id:1, username:'kingbettor',  content:'Man City are gonna demolish Arsenal this weekend 🔵' },
    { id:2, username:'pro_tipster', content:'Nah Arsenal have the better form right now. Calling the upset 🔴' },
    { id:3, username:'lucky_ace',   content:'Both of you wrong, it\'s Liverpool\'s year 🏆' },
    { id:4, username:'kingbettor',  content:'Talk is cheap, let\'s see the points at full time 😏' },
  ];
}
