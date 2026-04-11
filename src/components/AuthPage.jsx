import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Mail, Lock, Eye, EyeOff, AlertCircle,
  Loader2, ArrowLeft, KeyRound, Hash,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── background orbs (same as App) ────────────────────────────────────────────
function BgOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, var(--orb1) 0%, transparent 70%)', animation: 'float1 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, var(--orb2) 0%, transparent 70%)', animation: 'float2 10s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '40%', right: '20%', width: '25vw', height: '25vw', borderRadius: '50%', background: 'radial-gradient(circle, var(--orb3) 0%, transparent 70%)', animation: 'float3 12s ease-in-out infinite' }} />
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(3%,3%) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-2%,-4%) scale(1.08)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(2%,-3%) scale(0.95)} 66%{transform:translate(-2%,2%) scale(1.05)} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── email / password field ────────────────────────────────────────────────────
function InputField({ icon: Icon, type, placeholder, value, onChange, showToggle, onToggle, shown, autoFocus }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 14px', transition: 'border-color 0.2s' }}
      onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'}
      onBlur={e  => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <Icon size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      <input
        autoFocus={autoFocus}
        type={showToggle ? (shown ? 'text' : 'password') : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 15, minWidth: 0 }}
      />
      {showToggle && (
        <button type="button" onClick={onToggle} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {shown ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
  );
}

// ── 6-box OTP input ───────────────────────────────────────────────────────────
function OtpBoxes({ value, onChange }) {
  const refs = useRef([]);
  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...value.padEnd(6, ' ')];
    next[i] = v || ' ';
    const joined = next.join('').trimEnd();
    onChange(joined);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (!value[i] && i > 0) refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft'  && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      refs.current[Math.min(pasted.length, 5)]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <motion.input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={(value[i] || '').trim()}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
          whileFocus={{ scale: 1.08, borderColor: 'rgba(124,58,237,0.7)' }}
          style={{
            width: 44, height: 54, textAlign: 'center',
            fontSize: 22, fontWeight: 700, letterSpacing: 0,
            background: value[i] ? 'rgba(124,58,237,0.08)' : 'var(--surface-1)',
            border: `1.5px solid ${value[i] ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
            borderRadius: 12, color: 'var(--text-primary)', outline: 'none',
            transition: 'all 0.15s',
          }}
        />
      ))}
    </div>
  );
}

// ── reusable submit button ────────────────────────────────────────────────────
function SubmitBtn({ loading, disabled, label, loadingLabel }) {
  const active = !loading && !disabled;
  return (
    <motion.button
      type="submit"
      disabled={loading || disabled}
      whileHover={active ? { scale: 1.01, boxShadow: '0 0 24px rgba(124,58,237,0.4)' } : {}}
      whileTap={active ? { scale: 0.98 } : {}}
      style={{
        marginTop: 4, padding: '12px', borderRadius: 12, border: 'none', width: '100%',
        background: active ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'var(--surface-2)',
        color: active ? 'white' : 'var(--text-muted)',
        fontSize: 14, fontWeight: 600,
        cursor: active ? 'pointer' : 'not-allowed',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'background 0.2s',
      }}
    >
      {loading
        ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {loadingLabel}</>
        : label
      }
    </motion.button>
  );
}

// ── alert box ─────────────────────────────────────────────────────────────────
function Alert({ msg, isSuccess }) {
  if (!msg) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{
        display: 'flex', gap: 8, alignItems: 'flex-start', borderRadius: 10,
        padding: '10px 12px', fontSize: 12,
        background: isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
        color: isSuccess ? '#10b981' : '#ef4444',
      }}
    >
      {!isSuccess && <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />}
      {msg}
    </motion.div>
  );
}

// ── back link ─────────────────────────────────────────────────────────────────
function BackLink({ onClick, label = 'Back to sign in' }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 18 }}>
      <ArrowLeft size={13} /> {label}
    </button>
  );
}

// ── normalise Supabase errors ─────────────────────────────────────────────────
function fmtError(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('rate limit') || m.includes('over_email_send_rate_limit'))
    return 'Too many emails sent. Please wait a few minutes and try again.';
  if (m.includes('email not confirmed'))
    return 'Email not confirmed. Disable "Confirm email" in Supabase → Authentication → Providers → Email.';
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'Incorrect email or password.';
  if (m.includes('token has expired') || m.includes('otp expired'))
    return 'Code has expired. Please request a new one.';
  if (m.includes('token is invalid') || m.includes('otp invalid'))
    return 'Incorrect code. Please check and try again.';
  return msg;
}

// ── main component ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const { signIn, signUp, sendOtp, verifyOtp, forgotPassword } = useAuth();

  // mode: 'signin' | 'signup' | 'forgot' | 'otp'
  const [mode,     setMode]     = useState('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [otp,      setOtp]      = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [otpSent,  setOtpSent]  = useState(false);   // true after OTP email sent

  const reset = () => { setError(''); setSuccess(''); };

  const goTo = (m) => { setMode(m); reset(); setOtp(''); setOtpSent(false); };

  // ── sign in ────────────────────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault(); reset();
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) setError(fmtError(err.message));
    setLoading(false);
  };

  // ── sign up ────────────────────────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault(); reset();
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 6)  return setError('Password must be at least 6 characters.');
    setLoading(true);
    const { error: err } = await signUp(email, password);
    if (err) {
      setError(fmtError(err.message));
    } else {
      setSuccess('Account created! You can now sign in.');
      goTo('signin');
    }
    setLoading(false);
  };

  // ── forgot password ────────────────────────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault(); reset();
    setLoading(true);
    const { error: err } = await forgotPassword(email);
    if (err) {
      setError(fmtError(err.message));
    } else {
      setSuccess(`Reset link sent! Check your email. Click the link and you'll be brought back here to set a new password.`);
    }
    setLoading(false);
  };

  // ── OTP: send code ─────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault(); reset();
    setLoading(true);
    const { error: err } = await sendOtp(email);
    if (err) {
      setError(fmtError(err.message));
    } else {
      setOtpSent(true);
      setSuccess(`A 6-digit code was sent to ${email}`);
    }
    setLoading(false);
  };

  // ── OTP: verify code ───────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault(); reset();
    if (otp.replace(/\s/g, '').length < 6) return setError('Please enter all 6 digits.');
    setLoading(true);
    const { error: err } = await verifyOtp(email, otp.replace(/\s/g, ''));
    if (err) setError(fmtError(err.message));
    setLoading(false);
  };

  // ── logo ───────────────────────────────────────────────────────────────────
  const Logo = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
      <motion.div whileHover={{ rotate: 10, scale: 1.1 }}
        style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(124,58,237,0.5)', marginBottom: 12 }}>
        <Zap size={24} color="white" fill="white" />
      </motion.div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>FlowTrack</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Your personal task manager</div>
    </div>
  );

  const cardStyle = {
    background: 'var(--bg-card)', borderRadius: 20,
    border: '1px solid rgba(124,58,237,0.18)',
    boxShadow: '0 0 60px rgba(124,58,237,0.1), 0 24px 48px var(--shadow)',
    padding: 28,
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative' }}>
      <BgOrbs />
      <motion.div
        key={mode + String(otpSent)}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}
      >
        <Logo />

        {/* ── SIGN IN ── */}
        {mode === 'signin' && (
          <div style={cardStyle}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Welcome back</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sign in to access your tasks and analytics</div>
            </div>
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InputField icon={Mail} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              <InputField icon={Lock} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} showToggle shown={showPw} onToggle={() => setShowPw(v => !v)} />
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <button type="button" onClick={() => goTo('forgot')} style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontSize: 12, fontWeight: 500, padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <AnimatePresence>{(error || success) && <Alert msg={error || success} isSuccess={!!success} />}</AnimatePresence>
              <SubmitBtn loading={loading} disabled={!email || !password} label="Sign In" loadingLabel="Signing in…" />
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* OTP login button */}
            <motion.button
              type="button"
              onClick={() => goTo('otp')}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              style={{ width: '100%', padding: '11px', borderRadius: 12, border: '1.5px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.06)', color: '#a855f7', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Hash size={14} /> Sign in with OTP code
            </motion.button>

            <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <button type="button" onClick={() => goTo('signup')} style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: 0 }}>Sign up</button>
            </div>
          </div>
        )}

        {/* ── SIGN UP ── */}
        {mode === 'signup' && (
          <div style={cardStyle}>
            <BackLink onClick={() => goTo('signin')} label="Back to sign in" />
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Create account</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Start tracking your productivity today</div>
            </div>
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InputField icon={Mail} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              <InputField icon={Lock} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} showToggle shown={showPw} onToggle={() => setShowPw(v => !v)} />
              <InputField icon={Lock} placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} showToggle shown={showPw} onToggle={() => setShowPw(v => !v)} />
              <AnimatePresence>{(error || success) && <Alert msg={error || success} isSuccess={!!success} />}</AnimatePresence>
              <SubmitBtn loading={loading} disabled={!email || !password || !confirm} label="Create Account" loadingLabel="Creating account…" />
            </form>
          </div>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {mode === 'forgot' && (
          <div style={cardStyle}>
            <BackLink onClick={() => goTo('signin')} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={16} color="#a855f7" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Reset password</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>We'll email you a reset link</div>
              </div>
            </div>
            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InputField icon={Mail} type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              <AnimatePresence>{(error || success) && <Alert msg={error || success} isSuccess={!!success} />}</AnimatePresence>
              <SubmitBtn loading={loading} disabled={!email || !!success} label="Send Reset Link" loadingLabel="Sending…" />
            </form>
          </div>
        )}

        {/* ── OTP LOGIN ── */}
        {mode === 'otp' && (
          <div style={cardStyle}>
            <BackLink onClick={() => goTo('signin')} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hash size={16} color="#a855f7" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {otpSent ? 'Enter your code' : 'Sign in with OTP'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {otpSent ? `Code sent to ${email}` : 'No password needed — we email you a code'}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: enter email */}
              {!otpSent ? (
                <motion.form key="otp-email" onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <InputField icon={Mail} type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                  <AnimatePresence>{error && <Alert msg={error} />}</AnimatePresence>
                  <SubmitBtn loading={loading} disabled={!email} label="Send Code" loadingLabel="Sending code…" />
                </motion.form>
              ) : (
                /* Step 2: enter 6-digit code */
                <motion.form key="otp-verify" onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <AnimatePresence>{success && <Alert msg={success} isSuccess />}</AnimatePresence>
                  <OtpBoxes value={otp} onChange={setOtp} />
                  <AnimatePresence>{error && <Alert msg={error} />}</AnimatePresence>
                  <SubmitBtn loading={loading} disabled={otp.replace(/\s/g, '').length < 6} label="Verify & Sign In" loadingLabel="Verifying…" />
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    Didn't get it?{' '}
                    <button type="button" onClick={() => { setOtpSent(false); setOtp(''); reset(); }}
                      style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: 0 }}>
                      Resend code
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
