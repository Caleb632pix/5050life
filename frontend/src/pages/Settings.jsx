import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser, logout, updateUser } from '../store/slices/authSlice';
import { Shield, Bell, CreditCard, User, Lock, LogOut, AlertTriangle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Settings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(selectUser);
  const [section, setSection] = useState('profile');
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({
    bio:              user?.bio || '',
    notifyBetResult:  user?.notifyBetResult ?? true,
    notifyFollowers:  user?.notifyFollowers ?? true,
    notifyMessages:   user?.notifyMessages  ?? true,
    notifyPromotions: user?.notifyPromotions ?? false,
    depositLimit:     user?.depositLimit || '',
    dailyLossLimit:   user?.dailyLossLimit || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', { bio: form.bio });
      dispatch(updateUser({ bio: form.bio }));
      toast.success('Profile updated!');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const sections = [
    { key:'profile',    label:'Profile',            icon:User },
    { key:'security',   label:'Security & Login',   icon:Lock },
    { key:'kyc',        label:'Identity (KYC)',      icon:Shield },
    { key:'payments',   label:'Payment Methods',    icon:CreditCard },
    { key:'notifs',     label:'Notifications',      icon:Bell },
    { key:'responsible',label:'Responsible Gambling', icon:AlertTriangle },
  ];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 80 }}>
      <div style={{ padding: '20px 16px 0' }}>
        <h1 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:26, marginBottom:20 }}>⚙️ SETTINGS</h1>
      </div>

      <div style={{ display:'flex', gap:0 }}>
        {/* Nav */}
        <div style={{ width:180, flexShrink:0, padding:'0 0 0 16px' }} className="hidden-mobile">
          {sections.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              width:'100%', border:'none', borderRadius:'var(--radius)', cursor:'pointer', marginBottom:2,
              background: section===s.key ? 'var(--red-muted)' : 'transparent',
              color: section===s.key ? 'var(--red)' : 'var(--text-secondary)',
              fontWeight:700, fontSize:13, textAlign:'left'
            }}>
              <s.icon size={16} /> {s.label}
            </button>
          ))}
          <button onClick={() => { dispatch(logout()); navigate('/login'); }} style={{
            display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
            width:'100%', border:'none', borderRadius:'var(--radius)', cursor:'pointer',
            background:'transparent', color:'var(--error)', fontWeight:700, fontSize:13, marginTop:8
          }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:'0 16px' }}>
          {section === 'profile' && (
            <SettingsCard title="Profile">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" value={`@${user?.username}`} disabled style={{ opacity:0.5 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={user?.email || ''} disabled style={{ opacity:0.5 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-input" rows={3} placeholder="Tell the world about your betting style…" value={form.bio} onChange={e => set('bio', e.target.value)} style={{ resize:'none' }} maxLength={300} />
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{form.bio.length}/300</span>
              </div>
              <button className="btn btn-red" onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </SettingsCard>
          )}

          {section === 'kyc' && (
            <SettingsCard title="Identity Verification (KYC)">
              <div style={{
                background: user?.kycStatus === 'verified' ? 'rgba(0,200,83,0.1)' : 'rgba(245,124,0,0.1)',
                border:`1px solid ${user?.kycStatus==='verified' ? 'var(--green)' : 'var(--amber)'}`,
                borderRadius:'var(--radius)', padding:'14px', marginBottom:16
              }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>
                  Status: {user?.kycStatus === 'verified' ? '✅ Verified' : user?.kycStatus === 'pending' ? '⏳ Under Review' : '⚠️ Not Verified'}
                </div>
                <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
                  {user?.kycStatus === 'verified'
                    ? 'Your identity is verified. You have full access to all features.'
                    : 'KYC is required before placing bets or withdrawing funds. Submit your ID and a selfie.'}
                </div>
              </div>
              {user?.kycStatus !== 'verified' && (
                <button className="btn btn-blue">🪪 Start Verification</button>
              )}
            </SettingsCard>
          )}

          {section === 'notifs' && (
            <SettingsCard title="Notification Preferences">
              {[
                { key:'notifyBetResult',  label:'Bet Results',         desc:'When your bets are settled' },
                { key:'notifyFollowers',  label:'New Followers',        desc:'When someone follows you' },
                { key:'notifyMessages',   label:'Messages',             desc:'New DMs and mentions' },
                { key:'notifyPromotions', label:'Promotions & Offers',  desc:'Bonuses and platform news' },
              ].map(n => (
                <div key={n.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{n.label}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{n.desc}</div>
                  </div>
                  <label style={{ position:'relative', display:'inline-block', width:44, height:24, cursor:'pointer' }}>
                    <input type="checkbox" checked={form[n.key]} onChange={e => set(n.key, e.target.checked)} style={{ opacity:0, width:0, height:0 }} />
                    <span style={{
                      position:'absolute', inset:0, borderRadius:12,
                      background: form[n.key] ? 'var(--red)' : 'var(--border)', transition:'0.2s'
                    }}>
                      <span style={{
                        position:'absolute', left: form[n.key] ? 22 : 2, top:2, width:20, height:20,
                        borderRadius:'50%', background:'white', transition:'0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)'
                      }} />
                    </span>
                  </label>
                </div>
              ))}
            </SettingsCard>
          )}

          {section === 'responsible' && (
            <SettingsCard title="Responsible Gambling">
              <div style={{ background:'rgba(245,124,0,0.1)', border:'1px solid var(--amber)', borderRadius:'var(--radius)', padding:14, marginBottom:16 }}>
                <div style={{ fontWeight:700, marginBottom:4 }}>⚠️ Gamble Responsibly</div>
                <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
                  These tools are here to help you stay in control. They take effect immediately and cannot be reversed during the active period.
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Daily Deposit Limit ($)</label>
                <input className="form-input" type="number" min="1" placeholder="No limit" value={form.depositLimit} onChange={e => set('depositLimit', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Daily Loss Limit ($)</label>
                <input className="form-input" type="number" min="1" placeholder="No limit" value={form.dailyLossLimit} onChange={e => set('dailyLossLimit', e.target.value)} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                {[
                  { label:'Take a 24-hour break', action:'24h timeout' },
                  { label:'Take a 7-day break',   action:'7 day timeout' },
                  { label:'Self-exclude for 30 days', action:'30 day exclusion' },
                ].map(o => (
                  <button key={o.action} className="btn btn-ghost" style={{ justifyContent:'space-between' }}
                    onClick={() => toast.success(`${o.action} applied`)}>
                    {o.label} <ChevronRight size={14} />
                  </button>
                ))}
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                Need help? Visit <a href="https://www.begambleaware.org" target="_blank" rel="noreferrer" style={{ color:'var(--blue-light)' }}>BeGambleAware.org</a> or call <strong>0808 8020 133</strong>
              </div>
            </SettingsCard>
          )}

          {['security','payments'].includes(section) && (
            <SettingsCard title={section === 'security' ? 'Security & Login' : 'Payment Methods'}>
              <div style={{ color:'var(--text-muted)', textAlign:'center', padding:'30px 0' }}>
                <div style={{ fontSize:32, marginBottom:10 }}>{section === 'security' ? '🔐' : '💳'}</div>
                <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:16, marginBottom:6 }}>
                  {section === 'security' ? 'Security Settings' : 'Payment Methods'}
                </div>
                <div style={{ fontSize:13 }}>Coming soon in the next update</div>
              </div>
            </SettingsCard>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, children }) {
  return (
    <div>
      <h2 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:18, marginBottom:14 }}>{title}</h2>
      <div className="card" style={{ marginBottom:16 }}>{children}</div>
    </div>
  );
}
