import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Send, Search, Plus, Target, ChevronLeft, Circle } from 'lucide-react';
import { selectUser } from '../store/slices/authSlice';
import { joinConversation, getSocket, startTyping, stopTyping } from '../services/socket';
import api from '../services/api';
import Avatar from '../components/Common/Avatar';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const { id: activeId } = useParams();
  const navigate   = useNavigate();
  const currentUser = useSelector(selectUser);
  const [conversations, setConvos] = useState(getMockConversations());
  const [activeConvo, setActive]   = useState(null);
  const [messages, setMessages]    = useState([]);
  const [input, setInput]          = useState('');
  const [typing, setTyping]        = useState(false);
  const [sending, setSending]      = useState(false);
  const [search, setSearch]        = useState('');
  const endRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (activeId) {
      const found = conversations.find(c => c._id === activeId);
      if (found) {
        setActive(found);
        loadMessages(activeId);
        joinConversation(activeId);
      }
    }
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time message listener
  useEffect(() => {
    const handler = (e) => {
      const { message, conversationId } = e.detail;
      if (conversationId === activeId) {
        setMessages(prev => [...prev, message]);
      }
      // Update last message in conversation list
      setConvos(prev => prev.map(c =>
        c._id === conversationId
          ? { ...c, lastMessage: { content: message.content, sentAt: message.createdAt } }
          : c
      ));
    };
    window.addEventListener('new_message', handler);
    return () => window.removeEventListener('new_message', handler);
  }, [activeId]);

  const loadMessages = async (convoId) => {
    try {
      const { data } = await api.get(`/social/conversations/${convoId}/messages`);
      setMessages(data.data.messages);
    } catch {
      setMessages(getMockMessages(convoId));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    // Optimistic update
    const tempMsg = {
      _id: Date.now(), senderId: currentUser?.id, senderName: currentUser?.username,
      content, createdAt: new Date(), type: 'text', _pending: true
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.post('/social/messages', { conversationId: activeId, content });
    } catch {
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? { ...m, _failed: true } : m));
    } finally { setSending(false); }
  };

  const handleTyping = (val) => {
    setInput(val);
    startTyping(activeId);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => stopTyping(activeId), 1500);
  };

  const filteredConvos = conversations.filter(c =>
    !search || c.participants?.some(p => p.toLowerCase().includes(search.toLowerCase()))
  );

  const isMobile = window.innerWidth < 768;
  const showList = !isMobile || !activeId;
  const showChat = !isMobile || !!activeId;

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 0px)', overflow: 'hidden',
      background: 'var(--bg)'
    }}>

      {/* ── Conversation list ─────────────────────────────────────── */}
      {showList && (
        <div style={{
          width: isMobile ? '100%' : 280, flexShrink: 0,
          borderRight: '1px solid var(--border)', display: 'flex',
          flexDirection: 'column', background: 'var(--bg-card)'
        }}>
          <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h2 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:20 }}>Messages</h2>
              <button style={{ background:'none', border:'none', color:'var(--blue-light)', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:13, fontWeight:700 }}>
                <Plus size={14} /> New
              </button>
            </div>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft:28, height:34, fontSize:13 }}
                placeholder="Search conversations…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {filteredConvos.map(convo => (
              <ConvoItem
                key={convo._id} convo={convo} currentUser={currentUser}
                isActive={activeId === convo._id}
                onClick={() => navigate(`/messages/${convo._id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Chat area ─────────────────────────────────────────────── */}
      {showChat && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {activeConvo ? (
            <>
              {/* Chat header */}
              <div style={{
                padding:'12px 16px', borderBottom:'1px solid var(--border)',
                display:'flex', alignItems:'center', gap:10, background:'var(--bg-card)'
              }}>
                {isMobile && (
                  <button onClick={() => navigate('/messages')} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div style={{
                  width:40, height:40, borderRadius:'50%', flexShrink:0,
                  background:'linear-gradient(135deg,var(--red),var(--blue))',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'white', fontWeight:900, fontFamily:'var(--font-cond)', fontSize:16
                }}>
                  {(activeConvo.name || activeConvo.participants?.[0])?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>
                    {activeConvo.name || activeConvo.participants?.find(p => p !== currentUser?.username)}
                  </div>
                  <div style={{ fontSize:11, color:'var(--green)', display:'flex', alignItems:'center', gap:4 }}>
                    <Circle size={6} fill="var(--green)" /> Online
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }} onClick={() => navigate(`/betting?challenge=${activeConvo._id}`)}>
                  <Target size={14} /> Send Bet
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
                {messages.map((msg, i) => (
                  <MessageBubble key={msg._id || i} msg={msg} isOwn={msg.senderId === currentUser?.id} />
                ))}
                {typing && (
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <div style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic' }}>typing…</div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg-card)' }}>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                  <textarea
                    className="form-input"
                    placeholder="Say something… 💬"
                    value={input}
                    onChange={e => handleTyping(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    rows={1}
                    style={{ flex:1, resize:'none', fontSize:14, maxHeight:100, overflowY:'auto' }}
                  />
                  <button
                    className="btn btn-red"
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    style={{ padding:'10px 14px', flexShrink:0 }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, color:'var(--text-muted)' }}>
              <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:24, opacity:0.2 }}>
                50/50 Life Messages
              </div>
              <div style={{ fontSize:13 }}>Select a conversation or start a new one</div>
              <button className="btn btn-blue">
                <Plus size={14} /> New Message
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConvoItem({ convo, currentUser, isActive, onClick }) {
  const name   = convo.name || convo.participants?.find(p => p !== currentUser?.username) || '?';
  const unread = convo.unreadCount || 0;

  return (
    <div onClick={onClick} style={{
      padding:'12px 14px', cursor:'pointer', display:'flex', gap:10, alignItems:'center',
      background: isActive ? 'var(--red-muted)' : 'transparent',
      borderLeft: isActive ? '3px solid var(--red)' : '3px solid transparent',
      transition:'all 0.15s'
    }}>
      <div style={{
        width:44, height:44, borderRadius:'50%', flexShrink:0,
        background:'linear-gradient(135deg,var(--red),var(--blue))',
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'white', fontWeight:900, fontFamily:'var(--font-cond)', fontSize:18
      }}>{name[0]?.toUpperCase()}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
          <span style={{ fontWeight:700, fontSize:13 }}>{name}</span>
          {convo.lastMessage?.sentAt && (
            <span style={{ fontSize:10, color:'var(--text-muted)' }}>
              {formatDistanceToNow(new Date(convo.lastMessage.sentAt), { addSuffix: false })}
            </span>
          )}
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {convo.lastMessage?.content || 'No messages yet'}
        </div>
      </div>
      {unread > 0 && (
        <div style={{
          width:18, height:18, borderRadius:'50%', background:'var(--red)',
          color:'white', fontSize:10, fontWeight:900, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>{unread}</div>
      )}
    </div>
  );
}

function MessageBubble({ msg, isOwn }) {
  return (
    <div style={{ display:'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', gap:6 }}>
      {!isOwn && (
        <div style={{
          width:28, height:28, borderRadius:'50%', flexShrink:0,
          background:'linear-gradient(135deg,var(--red),var(--blue))',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'white', fontSize:11, fontWeight:900, alignSelf:'flex-end'
        }}>{msg.senderName?.[0]?.toUpperCase()}</div>
      )}
      <div style={{ maxWidth:'72%' }}>
        {!isOwn && msg.senderName && (
          <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:2, paddingLeft:2 }}>
            @{msg.senderName}
          </div>
        )}
        <div style={{
          padding:'10px 14px', borderRadius:16,
          borderBottomRightRadius: isOwn ? 4 : 16,
          borderBottomLeftRadius:  isOwn ? 16 : 4,
          background: isOwn
            ? 'linear-gradient(135deg,var(--red),var(--blue))'
            : 'var(--bg-card)',
          border: isOwn ? 'none' : '1px solid var(--border)',
          color: isOwn ? 'white' : 'var(--text-primary)',
          fontSize:14, lineHeight:1.5,
          opacity: msg._pending ? 0.7 : 1
        }}>
          {msg.content}
        </div>
        <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2, paddingLeft:2, textAlign: isOwn ? 'right' : 'left' }}>
          {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : ''}
          {msg._pending && ' · Sending…'}
          {msg._failed && ' · ⚠️ Failed'}
        </div>
      </div>
    </div>
  );
}

function getMockConversations() {
  return [
    { _id:'c1', participants:['kingbettor'], name:null, unreadCount:2, lastMessage:{ content:'You taking the over on Lakers tonight?', sentAt:new Date(Date.now()-300000) } },
    { _id:'c2', participants:['pro_tipster'], name:null, unreadCount:0, lastMessage:{ content:'Good bet bro, man city are 🔥', sentAt:new Date(Date.now()-3600000) } },
    { _id:'c3', participants:['lucky_ace'], name:null, unreadCount:1, lastMessage:{ content:'Send me that $50 you owe me 😂', sentAt:new Date(Date.now()-86400000) } },
    { _id:'c4', name:'⚽ PL Prediction Squad', isGroup:true, participants:['kingbettor','pro_tipster','lucky_ace'], unreadCount:5, lastMessage:{ content:'Arsenal to win the title 🏆', sentAt:new Date(Date.now()-7200000) } },
  ];
}

function getMockMessages(convoId) {
  return [
    { _id:'m1', senderId:'other', senderName:'kingbettor', content:'Yo, you watching the game tonight?', createdAt:new Date(Date.now()-3600000), type:'text' },
    { _id:'m2', senderId:'me', senderName:'me', content:'Yeah, betting big on Man City. 1.85 odds looks value 🎯', createdAt:new Date(Date.now()-3500000), type:'text' },
    { _id:'m3', senderId:'other', senderName:'kingbettor', content:'Bro Arsenal have been incredible this form. You sure?', createdAt:new Date(Date.now()-3400000), type:'text' },
    { _id:'m4', senderId:'me', senderName:'me', content:'100% confident. Wanna take the other side? I\'ll create a P2P bet', createdAt:new Date(Date.now()-3300000), type:'text' },
    { _id:'m5', senderId:'other', senderName:'kingbettor', content:'Say less, send me the bet challenge 💪', createdAt:new Date(Date.now()-60000), type:'text' },
  ];
}
