import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Trophy, Target, Users, TrendingUp, Edit, Share2, UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import { selectUser } from '../store/slices/authSlice';
import PostCard from '../components/Feed/PostCard';
import BetCard from '../components/Betting/BetCard';
import api from '../services/api';
import toast from 'react-hot-toast';

const TABS = ['Posts', 'Bets', 'Results', 'Following', 'Followers'];

export default function Profile() {
  const { username } = useParams();
  const navigate     = useNavigate();
  const currentUser  = useSelector(selectUser);
  const isOwn        = currentUser?.username === username;

  const [profile, setProfile]   = useState(null);
  const [posts, setPosts]        = useState([]);
  const [bets, setBets]          = useState([]);
  const [tab, setTab]            = useState('Posts');
  const [following, setFollowing]= useState(false);
  const [loading, setLoading]    = useState(true);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profRes, postsRes] = await Promise.all([
        api.get(`/users/${username}`).catch(() => ({ data: { data: getMockProfile(username) } })),
        api.get(`/social/posts?username=${username}`).catch(() => ({ data: { data: { posts: [] } } }))
      ]);
      const prof = profRes.data?.data?.user || profRes.data?.data || getMockProfile(username);
      setProfile(prof);
      setFollowing(prof.isFollowing || false);
      setPosts(postsRes.data?.data?.posts || []);
      setBets(getMockBets(username));
    } finally { setLoading(false); }
  };

  const handleFollow = async () => {
    try {
      await api.post(`/social/follow/${profile.id}`);
      setFollowing(f => !f);
      setProfile(p => ({ ...p, followersCount: p.followersCount + (following ? -1 : 1) }));
      toast.success(following ? `Unfollowed @${username}` : `Now following @${username}!`);
    } catch { toast.error('Failed to update follow'); }
  };

  const winRate = profile
    ? profile.totalBets > 0 ? ((profile.totalWins / profile.totalBets) * 100).toFixed(1) : 0
    : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🤷</div>
        <h2>User not found</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 80 }}>

      {/* Banner */}
      <div style={{
        height: 140, background: 'linear-gradient(135deg,#1a0000 0%,#000d33 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 80, opacity: 0.06,
          color: 'white', letterSpacing: -4, whiteSpace: 'nowrap'
        }}>50/50 LIFE</div>
        {/* Red/blue split line */}
        <div style={{
          position:'absolute', left:0, right:0, bottom:0, height:3,
          background:'linear-gradient(90deg,var(--red),var(--blue))'
        }} />
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Avatar + action row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:-44, marginBottom:16 }}>
          <div style={{
            width:88, height:88, borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg,var(--red),var(--blue))',
            border:'4px solid var(--bg)', display:'flex', alignItems:'center',
            justifyContent:'center', fontFamily:'var(--font-cond)', fontWeight:900,
            fontSize:34, color:'white'
          }}>
            {profile.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ display:'flex', gap:8, paddingBottom:4 }}>
            {isOwn ? (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/settings')}>
                <Edit size={14} /> Edit Profile
              </button>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/messages/${profile.id}`)}>
                  <MessageSquare size={14} />
                </button>
                <button
                  className={`btn btn-sm ${following ? 'btn-ghost' : 'btn-blue'}`}
                  onClick={handleFollow}
                >
                  {following ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                </button>
              </>
            )}
            <button className="btn btn-ghost btn-sm">
              <Share2 size={14} />
            </button>
          </div>
        </div>

        {/* User info */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <h1 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:24 }}>
              @{profile.username}
            </h1>
            {profile.kycStatus === 'verified' && (
              <span style={{ background:'var(--blue-muted)', color:'var(--blue-light)', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, border:'1px solid rgba(0,51,204,0.3)' }}>
                ✓ VERIFIED
              </span>
            )}
            {profile.role !== 'user' && (
              <span style={{ background:'var(--red-muted)', color:'var(--red)', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>
                {profile.role.toUpperCase()}
              </span>
            )}
          </div>
          {profile.firstName && (
            <div style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:4 }}>
              {profile.firstName} {profile.lastName}
            </div>
          )}
          {profile.bio && <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.5 }}>{profile.bio}</p>}
        </div>

        {/* Follow stats */}
        <div style={{ display:'flex', gap:20, marginBottom:20, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
          {[
            { label:'Followers', value: profile.followersCount || 0 },
            { label:'Following', value: profile.followingCount || 0 },
            { label:'Posts',     value: profile.postsCount || 0 },
          ].map(s => (
            <div key={s.label} style={{ cursor:'pointer' }} onClick={() => setTab(s.label)}>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:20 }}>{s.value.toLocaleString()}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Betting stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
          {[
            { label:'Total Bets', value: profile.totalBets || 0, icon:'🎯', color:'var(--text-primary)' },
            { label:'Wins',       value: profile.totalWins || 0, icon:'🏆', color:'var(--green)' },
            { label:'Win Rate',   value: `${winRate}%`,          icon:'📈', color: winRate > 50 ? 'var(--green)' : 'var(--amber)' },
            { label:'Total Won',  value: `$${parseFloat(profile.totalWon||0).toFixed(0)}`, icon:'💰', color:'var(--amber)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding:'12px', textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:20, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        position:'sticky', top:0, zIndex:10, background:'var(--bg)',
        borderBottom:'1px solid var(--border)', display:'flex', padding:'0 16px'
      }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'12px 14px', border:'none', background:'none', cursor:'pointer',
            fontWeight:700, fontSize:12, textTransform:'uppercase', letterSpacing:'0.05em',
            color: tab===t ? 'var(--red)' : 'var(--text-muted)',
            borderBottom: tab===t ? '2px solid var(--red)' : '2px solid transparent'
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'12px 16px' }}>
        {tab === 'Posts'   && (posts.length > 0 ? posts.map(p => <PostCard key={p._id} post={p} />) : <EmptyState icon="📝" msg="No posts yet" />)}
        {tab === 'Bets'    && (bets.length > 0 ? bets.map(b => <BetCard key={b.id} bet={b} />) : <EmptyState icon="🎯" msg="No bets yet" />)}
        {tab === 'Results' && <ResultsTab bets={bets.filter(b => b.status === 'settled')} />}
        {tab === 'Following' && <FollowList userId={profile.id} type="following" />}
        {tab === 'Followers' && <FollowList userId={profile.id} type="followers" />}
      </div>
    </div>
  );
}

function ResultsTab({ bets }) {
  return bets.length === 0
    ? <EmptyState icon="📊" msg="No settled bets yet" />
    : (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {bets.map(b => (
          <div key={b.id} className="card" style={{ borderLeft:`3px solid ${b.result==='win'?'var(--green)':'var(--error)'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>{b.eventName}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{b.selection} @ {b.odds}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18, color:b.result==='win'?'var(--green)':'var(--error)' }}>
                  {b.result==='win' ? `+$${b.netPayout?.toFixed(2)}` : `-$${b.stake}`}
                </div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{b.result?.toUpperCase()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
}

function FollowList({ userId, type }) {
  const mockUsers = [
    { username:'kingbettor',  totalBets:147, totalWins:89 },
    { username:'pro_tipster', totalBets:203, totalWins:118 },
    { username:'lucky_ace',   totalBets:55,  totalWins:31 },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {mockUsers.map(u => (
        <div key={u.username} className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:44, height:44, borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg,var(--red),var(--blue))',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', fontWeight:900, fontSize:18, fontFamily:'var(--font-cond)'
          }}>{u.username[0].toUpperCase()}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700 }}>@{u.username}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{u.totalBets} bets · {u.totalWins} wins</div>
          </div>
          <button className="btn btn-blue btn-sm"><UserPlus size={13} /> Follow</button>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div style={{ textAlign:'center', padding:'50px 0', color:'var(--text-muted)' }}>
      <div style={{ fontSize:40, marginBottom:10 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:16 }}>{msg}</div>
    </div>
  );
}

function getMockProfile(username) {
  return {
    id:'u1', username, firstName:'Alex', lastName:'Johnson', kycStatus:'verified',
    bio:'🎯 Professional bettor | ⚽ Football specialist | 📈 56% win rate since 2023',
    role:'user', followersCount:1247, followingCount:389, postsCount:84,
    totalBets:203, totalWins:114, totalWagered:12400, totalWon:9800
  };
}
function getMockBets(username) {
  return [
    { id:'b1', sport:'football', eventName:'Man City vs Arsenal', selection:'Man City Win', odds:1.85, stake:50, status:'open', result:null, netPayout:83.25, creator:{ username } },
    { id:'b2', sport:'basketball', eventName:'Lakers vs Warriors', selection:'Over 224.5', odds:1.90, stake:100, status:'settled', result:'win', netPayout:171, creator:{ username } },
    { id:'b3', sport:'esports', eventName:'NaVi vs Astralis', selection:'NaVi Win', odds:1.70, stake:30, status:'settled', result:'loss', netPayout:0, creator:{ username } },
  ];
}
