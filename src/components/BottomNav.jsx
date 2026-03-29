import { motion } from 'framer-motion';
import { CheckSquare, BarChart2 } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'var(--header-bg)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      padding: '8px 16px 12px',
      paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
    }}>
      {[
        { id: 'todos', label: 'Tasks', icon: CheckSquare },
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
      ].map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <motion.button
            key={id}
            onClick={() => setActiveTab(id)}
            whileTap={{ scale: 0.92 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 0',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: active ? '#a855f7' : 'var(--text-muted)',
              transition: 'color 0.2s',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              {active && (
                <motion.div
                  layoutId="tab-dot"
                  style={{
                    position: 'absolute',
                    bottom: -6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#a855f7',
                    boxShadow: '0 0 6px #a855f7',
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
