import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/slices/authSlice';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = ['Account', 'Personal', 'Confirm'];

export default function Register() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error, registrationSuccess } = useSelector(s => s.auth);
  const [step, setStep] = useState(0);
  const [showPwd, setShow] = useState(false);
  const [form, setForm] = useState({
    username:'', email:'', password:'', firstName:'', lastName:'',
    dateOfBirth:'', country:'', agreeTerms:false, agreeAge:false
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.agreeTerms || !form.agreeAge) {
      toast.error('Please accept the terms and confirm your age');
      return;
    }
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) {
      setStep(2);
    }
  };

  if (registrationSuccess || step === 2) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:16 }}>
        <div style={{ textAlign:'center', maxWidth:420 }}>
          <CheckCircle size={64} style={{ color:'var(--green)', marginBottom:20 }} />
          <h2 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:28, marginBottom:12 }}>You're in! 🎯</h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:24 }}>
            Check your email to verify your account, then come back to place your first bet on 50/50 Life.
          </p>
          <Link to="/login" className="btn btn-split btn-lg">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:16 }}>
      <div style={{ width:'100%', maxWidth:480 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:44, lineHeight:1 }}>
            <span style={{ color:'var(--red)' }}>50</span>
            <span style={{ color:'var(--text-muted)' }}>/</span>
            <span style={{ color:'var(--blue-light)' }}>50</span>
            <span style={{ color:'var(--text-secondary)', fontWeight:400, fontSize:22, marginLeft:8 }}>Life</span>
          </div>
        </div>

        <div className="card" style={{ padding:28 }}>
          {/* Progress */}
          <div style={{ display:'flex', gap:6, marginBottom:24 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex:1 }}>
                <div style={{ height:3, borderRadius:2, background: i <= step ? 'linear-gradient(90deg,var(--red),var(--blue))' : 'var(--border)', marginBottom:4 }} />
                <div style={{ fontSize:10, color: i === step ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === step ? 700 : 400 }}>{s}</div>
              </div>
            ))}
          </div>

          <h2 style={{ fontFamily:'var(--font-cond)', fontWeight:900, fontSize:22, marginBottom:20 }}>
            {step === 0 ? 'Create your account' : 'Tell us about you'}
          </h2>

          <form onSubmit={step === 1 ? submit : e => { e.preventDefault(); setStep(1); }}>
            {step === 0 && (
              <>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" placeholder="kingbettor99" value={form.username}
                    onChange={e => set('username', e.target.value.replace(/[^a-zA-Z0-9_]/g,''))} required minLength={3} maxLength={30} />
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>Letters, numbers, underscores only</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="your@email.com" value={form.email}
                    onChange={e => set('email', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position:'relative' }}>
                    <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="Min 8 chars, letters + numbers"
                      style={{ paddingRight:44 }} value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
                    <button type="button" onClick={() => setShow(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-split btn-full btn-lg">Continue →</button>
              </>
            )}

            {step === 1 && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-input" placeholder="Alex" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" placeholder="Johnson" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required
                    max={new Date(Date.now() - 18*365.25*24*60*60*1000).toISOString().split('T')[0]} />
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>Must be 18+ to use 50/50 Life</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <select className="form-input" value={form.country} onChange={e => set('country', e.target.value)} required>
                    <option value="">Select country…</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="US">🇺🇸 United States</option>
                    <option value="AU">🇦🇺 Australia</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="IE">🇮🇪 Ireland</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="IN">🇮🇳 India</option>
                    <option value="NG">🇳🇬 Nigeria</option>
                    <option value="ZA">🇿🇦 South Africa</option>
                    <option value="SG">🇸🇬 Singapore</option>
                    <option value="NZ">🇳🇿 New Zealand</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                  <label style={{ display:'flex', gap:10, cursor:'pointer', fontSize:13, alignItems:'flex-start' }}>
                    <input type="checkbox" checked={form.agreeAge} onChange={e => set('agreeAge', e.target.checked)} style={{ marginTop:2 }} />
                    <span>I confirm I am 18 years of age or older</span>
                  </label>
                  <label style={{ display:'flex', gap:10, cursor:'pointer', fontSize:13, alignItems:'flex-start' }}>
                    <input type="checkbox" checked={form.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)} style={{ marginTop:2 }} />
                    <span>I agree to the <Link to="/terms" style={{ color:'var(--blue-light)' }}>Terms of Service</Link> and <Link to="/privacy" style={{ color:'var(--blue-light)' }}>Privacy Policy</Link>. I understand 50/50 Life charges a 10% commission on all winning payouts.</span>
                  </label>
                </div>

                {error && (
                  <div style={{ background:'rgba(204,0,0,0.1)', border:'1px solid var(--red)', borderRadius:'var(--radius)', padding:'10px 12px', fontSize:13, color:'var(--error)', marginBottom:14 }}>
                    {error}
                  </div>
                )}

                <div style={{ display:'flex', gap:8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
                  <button type="submit" className="btn btn-split btn-lg" style={{ flex:1 }} disabled={loading || !form.agreeTerms || !form.agreeAge}>
                    {loading ? '⏳ Creating…' : '🚀 Create Account'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color:'var(--blue-light)', fontWeight:700 }}>Sign in</Link>
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:16, fontSize:11, color:'var(--text-muted)' }}>
          18+ only · Gamble responsibly · BeGambleAware.org
        </div>
      </div>
    </div>
  );
}
