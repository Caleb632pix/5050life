import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../Common/Avatar';

export default function PostCard({ post, onLike }) {
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : '';

  return (
    <div className="card card-hover" style={{ margin: '8px 16px', cursor: 'pointer' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div onClick={() => navigate(`/profile/${post.username}`)} style={{ flexShrink: 0 }}>
          <Avatar user={{ username: post.username, avatarUrl: post.avatarUrl }} size={40} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span onClick={() => navigate(`/profile/${post.username}`)}
              style={{ fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              @{post.username}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo}</span>
          </div>
          {post.hashtags?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
              {post.hashtags.map(h => (
                <span key={h} style={{ fontSize: 11, color: 'var(--blue-light)' }}>#{h}</span>
              ))}
            </div>
          )}
        </div>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Content */}
      {post.content && (
        <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 10, color: 'var(--text-primary)' }}>
          {post.content}
        </p>
      )}

      {/* Media */}
      {post.mediaUrls?.length > 0 && (
        <div style={{
          borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 10,
          display: 'grid', gridTemplateColumns: post.mediaUrls.length > 1 ? '1fr 1fr' : '1fr', gap: 2
        }}>
          {post.mediaUrls.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
          ))}
        </div>
      )}

      {/* Bet result block */}
      {post.type === 'bet_result' && post.betData && (
        <div style={{
          background: post.betData.result === 'win' ? 'rgba(0,200,83,0.1)' : 'rgba(204,0,0,0.1)',
          border: `1px solid ${post.betData.result === 'win' ? 'var(--green)' : 'var(--red)'}`,
          borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 10
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: post.betData.result === 'win' ? 'var(--green)' : 'var(--error)' }}>
            {post.betData.result === 'win' ? '🏆 BET WON' : '✕ BET LOST'}
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{post.betData.eventName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{post.betData.selection} @ {post.betData.odds}</div>
        </div>
      )}

      <hr className="divider" style={{ margin: '10px 0 8px' }} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4 }}>
        <ActionBtn
          icon={<Heart size={16} fill={post.isLiked ? 'var(--red)' : 'none'} />}
          label={post.likesCount || 0}
          active={post.isLiked}
          activeColor="var(--red)"
          onClick={() => onLike?.(post._id)}
        />
        <ActionBtn icon={<MessageCircle size={16} />} label={post.commentsCount || 0} />
        <ActionBtn icon={<Share2 size={16} />} label="Share" />
        <ActionBtn icon={<Bookmark size={16} fill={post.isBookmarked ? 'var(--blue)' : 'none'} />}
          active={post.isBookmarked} activeColor="var(--blue)" style={{ marginLeft: 'auto' }} />
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, active, activeColor = 'var(--red)', onClick, style }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
      background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
      color: active ? activeColor : 'var(--text-muted)', fontSize: 12, fontWeight: 600,
      transition: 'all 0.15s', ...style
    }}>
      {icon}
      {label !== undefined && <span>{label}</span>}
    </button>
  );
            }
            
