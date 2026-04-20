import { Component } from 'react';
import { RefreshCw, Zap } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[FlowTrack] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-primary)', padding: 24,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 18px',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 28px rgba(124,58,237,0.45)',
          }}>
            <Zap size={24} color="white" fill="white" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.3px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 22, lineHeight: 1.7 }}>
            An unexpected error occurred. Your data is safe — try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 11, border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 0 18px rgba(124,58,237,0.4)',
            }}
          >
            <RefreshCw size={14} />
            Reload App
          </button>
        </div>
      </div>
    );
  }
}
