import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, RefreshCw, TrendingUp } from 'lucide-react';
import PostCard from '../components/Feed/PostCard';
import BetCard from '../components/Betting/BetCard';
import CreatePostModal from '../components/Feed/CreatePostModal';
import api from '../services/api';

const TABS = ['All', 'Bets', 'Posts', 'Results'];

export default function Home() {
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('All');
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);
  const [showCreate, setCreate] = useState(false);

  const loadFeed = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const p = reset ? 1 : page;
      const { data } = await api.get('/social/feed', { params: { page: p, limit: 20 } });
      const newPosts = data.data.posts || [];
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === 20);
      if (!reset) setPage(p + 1);
    } catch {
      // use mock data in dev
      setPosts(getMockFeed());
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadFeed(true); }, [tab]);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)',
        borderBottom: '1px solid var(--border)', padding: '14px 16px 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-cond)', fontSize: 22, fontWeight: 900 }}>
            <span style={{ color: 'var(--red)' }}>50</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--blue-light)' }}>50</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 6, fontSize: 16 }}>Feed</span>
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => loadFeed(true)}>
              <RefreshCw size={14} />
            </button>
            <button className="btn btn-split btn-sm" onClick={() => setCreate(true)}>
              <Plus size={14} /> Create
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, color: tab === t ? 'var(--red)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--red)' : '2px solid transparent',
              transition: 'all 0.15s'
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Stories / quick bets bar */}
      <QuickBetsBar />

      {/* Feed */}
      <div style={{ padding: '0 0 20px' }}>
        {loading && posts.length === 0
          ? Array(4).fill(0).map((_, i) => <PostSkeleton key={i} />)
          : posts.map(post => (
            post.type?.includes('bet')
              ? <BetFeedCard key={post._id} post={post} />
              : <PostCard key={post._id} post={post} onLike={id => handleLike(id, setPosts)} />
          ))
        }
        {hasMore && !loading && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <button className="btn btn-ghost" onClick={() => loadFeed()}>Load more</button>
          </div>
        )}
        {!loading && posts.length === 0 && <EmptyFeed />}
      </div>

      {showCreate && <CreatePostModal onClose={() => setCreate(false)} onCreated={p => setPosts(prev => [p, ...prev])} />}
    </div>
  );
}

function QuickBetsBar() {
  const items = [
    { label: 'Man City', sport: '⚽', odds: '1.85', hot: true },
    { label: 'Lakers ML', sport: '🏀', odds: '2.10', hot: false },
    { label: 'NaVi Win', sport: '🎮', odds: '1.70', hot: true },
    { label: 'Djokovic', sport: '🎾', odds: '1.45', hot: false },
    { label: 'India T20', sport: '🏏', odds: '1.90', hot: true },
  ];

  return (
    <div style={{ overflowX: 'auto', padding: '14px 16px', display: 'flex', gap: 10, scrollbarWidth: 'none' }}>
      {items.map((item, i) => (
        <div key={i} style={{
          background: 'var(--bg-card)', border: `1px solid ${item.hot ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)', padding: '10px 14px', cursor: 'pointer',
          flexShrink: 0, transition: 'all 0.15s', minWidth: 110, textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, marginBottom: 4 }}>{item.sport}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{item.label}</div>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 18, color: 'var(--amber)' }}>
            {item.odds}
          </div>
          {item.hot && <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>🔥 HOT</div>}
        </div>
      ))}
    </div>
  );
}

function BetFeedCard({ post }) {
  const { betData, username, avatarUrl, createdAt } = post;
  return (
    <div className="card card-hover" style={{ margin: '8px 16px', borderLeft: '3px solid var(--red)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg,var(--red),var(--blue))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: 14
        }}>{username?.[0]?.toUpperCase()}</div>
        <div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>@{username}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>placed a bet challenge</span>
        </div>
        <span className="badge badge-open" style={{ marginLeft: 'auto' }}>● OPEN</span>
      </div>
      <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{betData?.eventName}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pick</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>{betData?.selection}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Odds</div>
            <div className="odds-display" style={{ fontSize: 20 }}>{betData?.odds}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stake</div>
            <div style={{ fontWeight: 700, color: 'var(--green)' }}>${betData?.stake}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn btn-red btn-sm" style={{ flex: 1 }}>⚔️ Accept Bet</button>
        <button className="btn btn-ghost btn-sm">Share</button>
      </div>
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="card" style={{ margin: '8px 16px' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 10, width: '25%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 14, marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 14, width: '80%' }} />
    </div>
  );
}

function EmptyFeed() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <TrendingUp size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
      <h3 style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, marginBottom: 8 }}>Your feed is empty</h3>
      <p style={{ fontSize: 13 }}>Follow other bettors or place your first bet to get started</p>
    </div>
  );
}

async function handleLike(postId, setPosts) {
  try {
    const { data } = await api.post(`/social/posts/${postId}/like`);
    setPosts(prev => prev.map(p => p._id === postId
      ? { ...p, isLiked: data.data.liked, likesCount: p.likesCount + (data.data.liked ? 1 : -1) }
      : p
    ));
  } catch {}
}

function getMockFeed() {
  return [
    { _id: '1', type: 'bet_challenge', username: 'kingbettor', content: '🎯 Who wants to take the other side?', betData: { eventName: 'Man City vs Arsenal', selection: 'Man City Win', odds: 1.85, stake: 50 }, likesCount: 12, commentsCount: 3, createdAt: new Date() },
    { _id: '2', type: 'text', username: 'pro_tipster', content: 'Liverpool looking strong this season. Backing them all the way 🔴 #PremierLeague', likesCount: 34, commentsCount: 7, createdAt: new Date() },
    { _id: '3', type: 'bet_result', username: 'lucky_ace', content: '🏆 Called it! Lakers over 224.5 was easy money tonight', betData: { eventName: 'Lakers vs Warriors', selection: 'Over 224.5', odds: 1.9, stake: 100, result: 'win' }, likesCount: 28, commentsCount: 5, createdAt: new Date() },
  ];
            }
                                          
