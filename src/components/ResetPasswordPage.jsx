import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function BgOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, var(--orb1) 0%, transparent 70%)', animation: 'float1 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, var(--orb2) 0%, transparent 70%)', animation: 'float2 10s ease-in-out infinite' }} />
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(3%,3%) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-2%,-4%) scale(1.08)} }
        @keyframes spin   { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6)  return setError('Password must be at least 6 characters.');
    if (password !== confirm)  return setError('Passwords do not match.');

    setLoading(true);
    const { error: err } = await updatePassword(password);
    if (err) {
      setError(err.message);
    } else {
      setDone(true);
    }
    setLoading(false);
  };

  const inputStyle = {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--surface-1)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '11px 14px',
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative' }}>
      <BgOrbs />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <motion.div whileHover={{ rotate: 10, scale: 1.1 }}
            style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(124,58,237,0.5)', marginBottom: 12 }}>
            <Zap size={24} color="white" fill="white" />
          </motion.div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>FlowTrack</div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: 20, border: '1px solid rgba(124,58,237,0.18)', boxShadow: '0 0 60px rgba(124,58,237,0.1), 0 24px 48px var(--shadow)', padding: 28 }}>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={26} color="#10b981" />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Password updated!</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You are now signed in. Your new password is active.</div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Set new password</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Choose a strong password for your account</div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Password */}
                  <div style={inputStyle}>
                    <Lock size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <input
                      autoFocus
                      type={showPw ? 'text' : 'password'}
                      placeholder="New password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, minWidth: 0 }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {/* Confirm */}
                  <div style={inputStyle}>
                    <Lock size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, minWidth: 0 }}
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#ef4444' }}>
                        <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button type="submit" disabled={loading || !password || !confirm}
                    whileHover={(!loading && password && confirm) ? { scale: 1.01, boxShadow: '0 0 24px rgba(124,58,237,0.4)' } : {}}
                    whileTap={(!loading && password && confirm) ? { scale: 0.98 } : {}}
                    style={{
                      marginTop: 4, padding: '12px', borderRadius: 12, border: 'none',
                      background: (!loading && password && confirm) ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'var(--surface-2)',
                      color: (!loading && password && confirm) ? 'white' : 'var(--text-muted)',
                      fontSize: 14, fontWeight: 600,
                      cursor: (!loading && password && confirm) ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    {loading
                      ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</>
                      : 'Update Password'
                    }
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
