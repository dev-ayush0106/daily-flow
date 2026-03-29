import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import TodoList from './components/TodoList';
import Analytics from './components/Analytics';
import { useTodos } from './hooks/useTodos';
import { useBreakpoints } from './hooks/useMediaQuery';
import { checkAndNotify } from './utils/notifications';
import './index.css';

function BgOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw',
        borderRadius: '50%', background: `radial-gradient(circle, var(--orb1) 0%, transparent 70%)`,
        animation: 'float1 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%', width: '40vw', height: '40vw',
        borderRadius: '50%', background: `radial-gradient(circle, var(--orb2) 0%, transparent 70%)`,
        animation: 'float2 10s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: '40%', right: '20%', width: '25vw', height: '25vw',
        borderRadius: '50%', background: `radial-gradient(circle, var(--orb3) 0%, transparent 70%)`,
        animation: 'float3 12s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(3%,3%) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-2%,-4%) scale(1.08)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(2%,-3%) scale(0.95)} 66%{transform:translate(-2%,2%) scale(1.05)} }
      `}</style>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('todos');
  const { todos, history, addTodo, toggleTodo, deleteTodo, editTodo, clearCompleted, rollForward, clearHistory } = useTodos();
  const { isMobile } = useBreakpoints();

  // Check for due tasks every minute
  useEffect(() => {
    const interval = setInterval(() => checkAndNotify(todos), 60000);
    return () => clearInterval(interval);
  }, [todos]);

  const activeTodos = todos.filter(t => !t.completed);

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', position: 'relative', background: 'var(--bg-primary)', transition: 'background 0.3s' }}>
      <BgOrbs />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="app-main">
          <AnimatePresence mode="wait">
            {activeTab === 'todos' ? (
              <motion.div
                key="todos"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div style={{ marginBottom: 24 }}>
                  <motion.h1
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
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
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div style={{ marginBottom: 24 }}>
                  <motion.h1
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}
                  >
                    Analytics
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
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

        {/* Mobile bottom nav */}
        {isMobile && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      </div>
    </div>
  );
}
