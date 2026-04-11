import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import TodoList from './components/TodoList';
import Analytics from './components/Analytics';
import AuthPage from './components/AuthPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import { useTodos } from './hooks/useTodos';
import { useAuth } from './context/AuthContext';
import { useBreakpoints } from './hooks/useMediaQuery';
import { checkAndNotify } from './utils/notifications';
import './index.css';

function BgOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: `radial-gradient(circle, var(--orb1) 0%, transparent 70%)`, animation: 'float1 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: `radial-gradient(circle, var(--orb2) 0%, transparent 70%)`, animation: 'float2 10s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '40%', right: '20%', width: '25vw', height: '25vw', borderRadius: '50%', background: `radial-gradient(circle, var(--orb3) 0%, transparent 70%)`, animation: 'float3 12s ease-in-out infinite' }} />
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(3%,3%) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-2%,-4%) scale(1.08)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(2%,-3%) scale(0.95)} 66%{transform:translate(-2%,2%) scale(1.05)} }
      `}</style>
    </div>
  );
}

function AppShell() {
  const [activeTab, setActiveTab] = useState('todos');
  const { todos, history, dataLoading, addTodo, toggleTodo, deleteTodo, editTodo, clearCompleted, rollForward, clearHistory } = useTodos();
  const { isMobile } = useBreakpoints();

  useEffect(() => {
    const interval = setInterval(() => checkAndNotify(todos), 60000);
    return () => clearInterval(interval);
  }, [todos]);

  const activeTodos = todos.filter(t => !t.completed);

  if (dataLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <BgOrbs />
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(124,58,237,0.5)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading your tasks…</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', background: 'var(--bg-primary)', transition: 'background 0.3s' }}>
      <BgOrbs />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="app-main">
          <AnimatePresence mode="wait">
            {activeTab === 'todos' ? (
              <motion.div key="todos" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                <div style={{ marginBottom: 24 }}>
                  <motion.h1
                    initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 4 }}
                  >
                    My Tasks
                    {!isMobile && (
                      <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                    style={{ fontSize: 13, color: 'var(--text-muted)' }}
                  >
                    {activeTodos.length === 0
                      ? todos.length > 0 ? '🎉 All tasks completed!' : 'No tasks yet — add your first task!'
                      : `${activeTodos.length} task${activeTodos.length !== 1 ? 's' : ''} remaining`}
                  </motion.p>
                </div>
                <TodoList
                  todos={todos}
                  onAdd={addTodo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={editTodo}
                  onClearCompleted={clearCompleted}
                  onRollForward={rollForward}
                />
              </motion.div>
            ) : (
              <motion.div key="analytics" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                <div style={{ marginBottom: 24 }}>
                  <motion.h1
                    initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}
                  >
                    Analytics
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                    style={{ fontSize: 13, color: 'var(--text-muted)' }}
                  >
                    Track your productivity, accuracy & concentration
                  </motion.p>
                </div>
                <Analytics todos={todos} history={history} onClearHistory={clearHistory} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {isMobile && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading, isRecovery } = useAuth();

  if (loading) return null;

  // User clicked the password-reset email link — show reset form first
  if (isRecovery) return <ResetPasswordPage />;

  return user ? <AppShell /> : <AuthPage />;
}