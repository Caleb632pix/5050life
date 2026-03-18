import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export function Login() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error } = useSelector(s => s.auth);
  const [identifier, setId]   = useState('');
  const [password, setPwd]    = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { dispatch(clearError()); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ identifier, password }));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back! 🎯');
      navigate('/');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: 16
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 48, lineHeight: 1, marginBottom: 8 }}>
            <span style={{ color: 'var(--red)' }}>50</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--blue-light)' }}>50</span>
          </div>
          <div style={{ fontFamily: 'var(--font-cond)', fontWeight: 700, fontSize: 18, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            LIFE
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            Where every bet is a 50/50 shot
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-cond)', fontWeight: 900, fontSize: 24, marginBottom: 24, textAlign: 'center' }}>
            Welcome Back
          </h2>

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <input className="form-input" placeholder="your@email.com or @username"
                value={identifier} onChange={e => setId(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPwd ? 'text' : 'password'}
                  placeholder="Your password" style={{ paddingRight: 44 }}
                  value={password} onChange={e => setPwd(e.target.value)} required />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 16, marginTop: -8 }}>
              <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--blue-light)' }}>Forgot password?</Link>
            </div>

            {error && (
              <div style={{ background: 'rgba(204,0,0,0.1)', border: '1px solid var(--red)', borderRadius: 'var(--radius)', padding: '10px 12px', fontSize: 13, color: 'var(--error)', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-split btn-full btn-lg" disabled={loading}>
              {loading ? '⏳ Signing in…' : '🎯 Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            No account? <Link to="/register" style={{ color: 'var(--blue-light)', fontWeight: 700 }}>Create one free</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-muted)' }}>
          18+ only · Gamble responsibly · 50/50 Life takes 10% commission
        </div>
      </div>
    </div>
  );
}

export default Login;
