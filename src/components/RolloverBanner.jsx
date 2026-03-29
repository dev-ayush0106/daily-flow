import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { isToday, parseISO, formatDistanceToNow, format } from 'date-fns';
import { CATEGORIES } from '../utils/analytics';

const DISMISS_KEY = 'dailytodo_rollover_dismissed';

function getDismissedDate() { return localStorage.getItem(DISMISS_KEY) || ''; }
function setDismissedToday() { localStorage.setItem(DISMISS_KEY, format(new Date(), 'yyyy-MM-dd')); }

export default function RolloverBanner({ todos, onRollForward }) {
  const [expanded,  setExpanded]  = useState(false);
  const [selected,  setSelected]  = useState(new Set());
  const [dismissed, setDismissed] = useState(
    () => getDismissedDate() === format(new Date(), 'yyyy-MM-dd')
  );

  const staleTasks = useMemo(
    () => todos.filter(t => !t.completed && t.createdAt && !isToday(parseISO(t.createdAt))),
    [todos]
  );

  if (staleTasks.length === 0 || dismissed) return null;

  const allSelected = staleTasks.every(t => selected.has(t.id));

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(staleTasks.map(t => t.id)));

  const handleRollAll      = () => onRollForward(staleTasks.map(t => t.id));
  const handleRollSelected = () => { if (selected.size > 0) { onRollForward([...selected]); setSelected(new Set()); } };
  const handleDismiss      = () => { setDismissedToday(); setDismissed(true); };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginBottom: 16, borderRadius: 14, border: '1px solid rgba(245,158,11,0.28)', background: 'linear-gradient(135deg, rgba(245,158,11,0.07), rgba(251,191,36,0.03))', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RotateCcw size={14} color="#f59e0b" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {staleTasks.length} unfinished task{staleTasks.length !== 1 ? 's' : ''} from previous days
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Roll them forward to today</div>
        </div>
        <div className="rollover-actions">
          <motion.button
            onClick={handleRollAll}
            whileHover={{ scale: 1.03, boxShadow: '0 0 14px rgba(245,158,11,0.35)' }}
            whileTap={{ scale: 0.96 }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <RotateCcw size={10} /> Roll All
          </motion.button>
          <button
            className="rollover-review"
            onClick={() => setExpanded(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(245,158,11,0.24)', background: 'rgba(245,158,11,0.08)', color: 'rgba(245,158,11,0.85)', fontSize: 12, cursor: 'pointer' }}
          >
            Review {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button onClick={handleDismiss} title="Dismiss for today" style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Expanded task list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid rgba(245,158,11,0.14)', padding: '10px 14px 12px' }}>
              {/* Select all */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <button onClick={toggleAll} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>
                  <div style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid rgba(245,158,11,0.4)`, background: allSelected ? '#f59e0b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    {allSelected && <Check size={9} color="white" strokeWidth={3} />}
                  </div>
                  Select all
                </button>
                <AnimatePresence>
                  {selected.size > 0 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      onClick={handleRollSelected}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <RotateCcw size={10} /> Roll {selected.size}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              {/* Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {staleTasks.map(todo => {
                  const cat = CATEGORIES.find(c => c.id === todo.category) || CATEGORIES[0];
                  const isChecked = selected.has(todo.id);
                  return (
                    <motion.div
                      key={todo.id}
                      layout
                      onClick={() => toggleSelect(todo.id)}
                      whileHover={{ background: 'rgba(245,158,11,0.06)' }}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 8, background: isChecked ? 'rgba(245,158,11,0.09)' : 'var(--surface-1)', border: `1px solid ${isChecked ? 'rgba(245,158,11,0.22)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.14s' }}
                    >
                      <div style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${isChecked ? '#f59e0b' : 'var(--border-light)'}`, background: isChecked ? '#f59e0b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.14s' }}>
                        {isChecked && <Check size={9} color="white" strokeWidth={3} />}
                      </div>
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{todo.text}</span>
                      <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: `${cat.color}18`, color: cat.color, flexShrink: 0 }}>{cat.icon}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-hint)', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatDistanceToNow(parseISO(todo.createdAt), { addSuffix: true })}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
