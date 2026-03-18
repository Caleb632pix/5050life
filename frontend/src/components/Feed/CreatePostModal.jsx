import React, { useState } from 'react';
import { Image, Target, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { Modal } from '../Common/NotificationPanel';
import Avatar from '../Common/Avatar';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function CreatePostModal({ onClose, onCreated }) {
  const user = useSelector(selectUser);
  const [content, setContent]   = useState('');
  const [type, setType]         = useState('text');
  const [visibility, setVis]    = useState('public');
  const [loading, setLoading]   = useState(false);

  const hashtags = (content.match(/#\w+/g) || []).map(h => h.slice(1));

  const submit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/social/posts', { content, type, visibility, hashtags });
      onCreated?.(data.data.post);
      toast.success('Post published!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Create Post" onClose={onClose}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <Avatar user={user} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>@{user?.username}</div>
          <select value={visibility} onChange={e => setVis(e.target.value)}
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 8px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <option value="public">🌍 Public</option>
            <option value="followers">👥 Followers</option>
            <option value="private">🔒 Private</option>
          </select>
        </div>
      </div>

      <textarea
        className="form-input"
        placeholder="What's your take? Share a pick, talk trash, challenge someone… 🎯"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={5}
        style={{ resize: 'none', fontSize: 15, marginBottom: 12 }}
        maxLength={2000}
      />

      {hashtags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {hashtags.map(h => (
            <span key={h} style={{ background: 'var(--blue-muted)', color: 'var(--blue-light)', padding: '2px 8px', borderRadius: 20, fontSize: 12 }}>#{h}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <Image size={16} /> Photo
          </button>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <Target size={16} /> Bet Pick
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: content.length > 1800 ? 'var(--error)' : 'var(--text-muted)' }}>
            {content.length}/2000
          </span>
          <button className="btn btn-red" onClick={submit} disabled={loading || !content.trim()}>
            {loading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
