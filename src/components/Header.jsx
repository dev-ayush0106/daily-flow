import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, BarChart2, Zap, Sun, Moon, Bell, BellOff, X, LogOut, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useBreakpoints } from '../hooks/useMediaQuery';
import { getPermissionState, requestPermission } from '../utils/notifications';
import { useAuth } from '../context/AuthContext';

function NotifPanel({ onClose }) {
  const [perm, setPerm] = useState(getPermissionState());

  const handleEnable = async () => {
    const result = await requestPermission();
    setPerm(result);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4 }}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
        borderRadius: 14, padding: 16, width: 260,
        boxShadow: '0 16px 40px var(--shadow)', zIndex: 200,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={14} />
        </button>
      </div>
      {perm === 'unsupported' && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your browser doesn't support notifications.</p>
      )}
      {perm === 'denied' && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Notifications are blocked. Enable them in browser settings.</p>
      )}
      {perm === 'default' && (
        <>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
            Get notified 10 minutes before a task is due.
          </p>
          <button
            onClick={handleEnable}
            style={{
              width: '100%', padding: '8px 0', borderRadius: 9,
              border: 'none', background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Enable Notifications
          </button>
        </>
      )}
      {perm === 'granted' && (
        <p style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>✓</span> Notifications are enabled. You'll be alerted 10 min before due tasks.
        </p>
      )}
    </motion.div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 10, border: 'none',
        background: 'transparent', cursor: 'pointer', width: '100%',
        color: danger ? '#ef4444' : 'var(--text-secondary)',
        fontSize: 13, fontWeight: 500, textAlign: 'left',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function Header({ activeTab, setActiveTab }) {
  const { isDark, toggleTheme } = useTheme();
  const { isMobile } = useBreakpoints();
  const { user, signOut } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const perm = getPermissionState();

  const initials = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--header-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="header-inner">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 18px rgba(124,58,237,0.5)',
            }}
          >
            <Zap size={16} color="white" fill="white" />
          </motion.div>
          {!isMobile && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1 }}>
                FlowTrack
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>Task Manager</div>
            </div>
          )}
        </div>

        {/* Desktop tab nav */}
        <div className="header-tabs" style={{
          display: 'flex',
          background: 'var(--surface-1)',
          borderRadius: 12, padding: 4, gap: 2,
          border: '1px solid var(--border)',
        }}>
          {[
            { id: 'todos', label: 'Tasks', icon: CheckSquare },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 9, border: 'none',
                background: activeTab === id ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'transparent',
                color: activeTab === id ? 'white' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: activeTab === id ? '0 0 15px rgba(124,58,237,0.4)' : 'none',
              }}
            >
              <Icon size={14} />
              {label}
            </motion.button>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!isMobile && (
            <span className="header-date" style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          )}

          {isMobile ? (
            <div style={{ position: 'relative' }}>
              {/* Hamburger button */}
              <button
                onClick={() => setMenuOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 10, border: 'none',
                  background: menuOpen ? 'var(--surface-1)' : 'transparent',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              {/* Dropdown menu */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
                      borderRadius: 16, padding: 10, width: 230,
                      boxShadow: '0 16px 40px var(--shadow)', zIndex: 200,
                    }}
                  >
                    {/* Account info */}
                    {user && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px 12px', marginBottom: 4,
                        borderBottom: '1px solid var(--border)',
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
                          boxShadow: '0 0 10px rgba(124,58,237,0.4)',
                        }}>
                          {initials}
                        </div>
                        <span style={{
                          fontSize: 12, color: 'var(--text-secondary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          flex: 1,
                        }}>
                          {user.email}
                        </span>
                      </div>
                    )}

                    {/* Menu items */}
                    <MenuItem
                      icon={perm === 'granted' ? <Bell size={15} /> : <BellOff size={15} />}
                      label="Notifications"
                      onClick={() => { setMenuOpen(false); setNotifOpen(v => !v); }}
                    />
                    <MenuItem
                      icon={isDark ? <Sun size={15} /> : <Moon size={15} />}
                      label={isDark ? 'Light Mode' : 'Dark Mode'}
                      onClick={() => { toggleTheme(); setMenuOpen(false); }}
                    />
                    {user && (
                      <MenuItem
                        icon={<LogOut size={15} />}
                        label="Sign Out"
                        onClick={() => { signOut(); setMenuOpen(false); }}
                        danger
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {menuOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setMenuOpen(false)} />
              )}

              {/* Notification panel (opens after closing menu) */}
              <AnimatePresence>
                {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} />}
              </AnimatePresence>
              {notifOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setNotifOpen(false)} />
              )}
            </div>
          ) : (
            <>
              {/* Notification bell */}
              <div style={{ position: 'relative' }}>
                <button
                  className={`notif-bell ${perm === 'granted' ? 'granted' : perm === 'denied' ? 'denied' : ''}`}
                  onClick={() => setNotifOpen(v => !v)}
                  title="Notifications"
                >
                  {perm === 'granted' ? <Bell size={15} /> : <BellOff size={15} />}
                </button>
                <AnimatePresence>
                  {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} />}
                </AnimatePresence>
                {notifOpen && (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setNotifOpen(false)} />
                )}
              </div>

              {/* Theme toggle */}
              <button className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                <motion.div
                  key={isDark ? 'moon' : 'sun'}
                  initial={{ rotate: -30, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 30, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                </motion.div>
              </button>

              {/* User avatar + logout */}
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    title={user.email}
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                      boxShadow: '0 0 10px rgba(124,58,237,0.4)',
                      cursor: 'default',
                    }}
                  >
                    {initials}
                  </div>
                  <motion.button
                    onClick={signOut}
                    whileHover={{ scale: 1.1, color: '#ef4444' }}
                    whileTap={{ scale: 0.9 }}
                    title="Sign out"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                  >
                    <LogOut size={15} />
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
