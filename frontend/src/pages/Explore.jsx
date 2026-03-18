import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users, Target } from 'lucide-react';
import PostCard from '../components/Feed/PostCard';
import BetCard from '../components/Betting/BetCard';

export default function Explore() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tab, setTab]     = useState('trending');

  const trendingPosts = getMockExplorePosts();
  const trendingBets  = getMockExploreBets();
  const suggestedUsers = getMockUsers();

  const filtered = query
    ? trendingPosts.filter(p => p.content?.toLowerCase().includes(query.toLowerCase()))
    : trendingPosts;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 80 }}>
      {/* Search header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)',
        borderBottom: '1px solid var(--border)', padding: '14px 16px'
      }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search bets, users, hashtags…"
            style={{ paddingLeft: 38, height: 42, fontSize: 15 }}
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['trending','bets','people'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 12, textTransform: 'uppercase',
              color: tab === t ? 'var(--red)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--red)' : '2px solid transparent'
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Hashtag pills */}
      {!query && tab === 'trending' && (
        <div style={{ padding: '14px 16px 0', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {['#PremierLeague','#NBA','#CS2','#UFC','#Cricket','#5050Life','#Esports','#Tennis'].map(tag => (
            <button key={tag} style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)',
              background: 'var(--bg-card)', color: 'var(--blue-light)', fontWeight: 700,
              fontSize: 12, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap'
            }}>{tag}</button>
          ))}
        </div>
      )}

      <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tab === 'trending' && filtered.map(p => <PostCard key={p._id} post={p} />)}
        {tab === 'bets'     && trendingBets.map(b => <BetCard key={b.id} bet={b} />)}
        {tab === 'people'   && suggestedUsers.map(u => (
          <div key={u.username} className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:48, height:48, borderRadius:'50%', flexShrink:0,
              background:'linear-gradient(135deg,var(--red),var(--blue))',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'white', fontWeight:900, fontFamily:'var(--font-cond)', fontSize:20
            }}>{u.username[0].toUpperCase()}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700 }}>@{u.username}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{u.followers} followers · {u.winRate}% win rate</div>
            </div>
            <button className="btn btn-blue btn-sm" onClick={() => navigate(`/profile/${u.username}`)}>View</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function getMockExplorePosts() {
  return [
    { _id:'e1', username:'kingbettor',  content:'🎯 Man City are a banker this weekend. Taking them at 1.85, easy money #PremierLeague', likesCount:47, commentsCount:12, createdAt:new Date() },
    { _id:'e2', username:'nba_sharp',   content:'💰 Lakers have been incredible on home court. Betting the over on their next 3 games #NBA', likesCount:33, commentsCount:8, createdAt:new Date() },
    { _id:'e3', username:'cs2_expert',  content:'NaVi dominated that map 16-4. They\'re looking unstoppable going into the Major #CS2 #Esports', likesCount:28, commentsCount:5, createdAt:new Date() },
    { _id:'e4', username:'lucky_ace',   content:'🏆 5 wins from 5 bets this week. The form is real 📈 #5050Life', likesCount:64, commentsCount:19, createdAt:new Date() },
  ];
}
function getMockExploreBets() {
  return [
    { id:'e1', sport:'football',   eventName:'Man City vs Arsenal',       selection:'Man City Win',   odds:1.85, stake:50,  status:'open',    creator:{username:'kingbettor'} },
    { id:'e2', sport:'basketball', eventName:'Lakers vs Warriors',         selection:'Over 224.5',     odds:1.90, stake:100, status:'open',    creator:{username:'nba_sharp'} },
    { id:'e3', sport:'tennis',     eventName:'Djokovic vs Alcaraz',        selection:'Djokovic Win',   odds:1.45, stake:200, status:'matched', creator:{username:'tennis_pro'} },
  ];
}
function getMockUsers() {
  return [
    { username:'kingbettor',  followers:1247, winRate:62 },
    { username:'pro_tipster', followers:892,  winRate:58 },
    { username:'sharp_line',  followers:634,  winRate:64 },
    { username:'lucky_ace',   followers:521,  winRate:54 },
  ];
}
