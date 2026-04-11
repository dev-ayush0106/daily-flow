import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Clock, FileText, X, RotateCcw } from 'lucide-react';
import { CATEGORIES, PRIORITIES } from '../utils/analytics';
import { useBreakpoints } from '../hooks/useMediaQuery';

const RECURRING = [
  { id: 'none',    label: 'No repeat' },
  { id: 'daily',   label: 'Daily' },
  { id: 'weekly',  label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

function hexToRgb(hex) {
  if (!hex) return '255,255,255';
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '255,255,255';
}

export default function AddTodo({ onAdd }) {
  const { isMobile } = useBreakpoints();
  const [open,      setOpen]      = useState(false);
  const [text,      setText]      = useState('');
  const [category,  setCategory]  = useState('personal');
  const [priority,  setPriority]  = useState('medium');
  const [dueDate,   setDueDate]   = useState('');
  const [dueTime,   setDueTime]   = useState('');
  const [recurring, setRecurring] = useState('none');
  const [notes,     setNotes]     = useState('');
  const [showExtra, setShowExtra] = useState(false);

  const cat = CATEGORIES.find(c => c.id === category);
  const pri = PRIORITIES.find(p => p.id === priority);

  const reset = () => { setText(''); setNotes(''); setDueDate(''); setDueTime(''); setRecurring('none'); setOpen(false); setShowExtra(false); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim(), category, priority, dueDate, dueTime, recurring, notes });
    reset();
  };

  const selectStyle = (color) => ({
    appearance: 'none',
    background: `rgba(${hexToRgb(color)}, 0.12)`,
    border: `1px solid rgba(${hexToRgb(color)}, 0.3)`,
    color,
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    outline: 'none',
    flexShrink: 0,
  });

  return (
    <div>
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={() => setOpen(true)}
            whileHover={{ scale: 1.005, boxShadow: '0 0 24px rgba(124,58,237,0.25)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', height: 56, padding: '0 18px', borderRadius: 14,
              border: '1.5px dashed rgba(124,58,237,0.35)',
              background: 'rgba(124,58,237,0.04)',
              color: 'rgba(168,85,247,0.75)',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 15, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(124,58,237,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plus size={14} color="#a855f7" />
            </div>
            Add a new task...
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 18,
              border: '1px solid rgba(124,58,237,0.22)',
              padding: isMobile ? 14 : 18,
              boxShadow: '0 0 36px rgba(124,58,237,0.12), 0 16px 32px var(--shadow)',
            }}
          >
            <form onSubmit={handleSubmit}>
              {/* Text input row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(124,58,237,0.4)' }}>
                  <Plus size={15} color="white" />
                </div>
                <input
                  autoFocus
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="What needs to be done?"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 15, fontWeight: 500, minWidth: 0 }}
                />
                <button type="button" onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
                  <X size={15} />
                </button>
              </div>

              {/* Options row */}
              <div className="addtodo-options">
                <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle(cat?.color)}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{c.icon} {c.label}</option>)}
                </select>

                <select value={priority} onChange={e => setPriority(e.target.value)} style={selectStyle(pri?.color)}>
                  {PRIORITIES.map(p => <option key={p.id} value={p.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{p.label} Priority</option>)}
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={12} color="var(--text-muted)" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: dueDate ? 'var(--text-primary)' : 'var(--text-muted)', borderRadius: 8, padding: '6px 8px', fontSize: 13, outline: 'none', cursor: 'pointer', maxWidth: isMobile ? 120 : 140 }}
                  />
                </div>

                {dueDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={12} color="var(--text-muted)" />
                    <input
                      type="time"
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: dueTime ? 'var(--text-primary)' : 'var(--text-muted)', borderRadius: 8, padding: '6px 8px', fontSize: 13, outline: 'none', cursor: 'pointer' }}
                    />
                  </div>
                )}

                {/* Recurring */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RotateCcw size={12} color="var(--text-muted)" />
                  <select
                    value={recurring}
                    onChange={e => setRecurring(e.target.value)}
                    style={{ background: recurring !== 'none' ? 'rgba(124,58,237,0.12)' : 'var(--surface-2)', border: `1px solid ${recurring !== 'none' ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`, color: recurring !== 'none' ? '#a855f7' : 'var(--text-muted)', borderRadius: 8, padding: '6px 8px', fontSize: 13, cursor: 'pointer', outline: 'none', appearance: 'none' }}
                  >
                    {RECURRING.map(r => <option key={r.id} value={r.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{r.label}</option>)}
                  </select>
                </div>

                {/* Notes toggle */}
                <button
                  type="button"
                  onClick={() => setShowExtra(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: showExtra ? 'var(--surface-3)' : 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, padding: '6px 10px', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
                >
                  <FileText size={11} /> Notes
                </button>
              </div>

              {/* Notes textarea */}
              <AnimatePresence>
                {showExtra && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginBottom: 14 }}
                  >
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add notes..."
                      rows={2}
                      style={{ width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 11px', color: 'var(--text-primary)', fontSize: 13, resize: 'none', outline: 'none' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <motion.button type="button" onClick={reset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Cancel
                </motion.button>
                <motion.button type="submit" disabled={!text.trim()} whileHover={text.trim() ? { scale: 1.02, boxShadow: '0 0 22px rgba(124,58,237,0.45)' } : {}} whileTap={text.trim() ? { scale: 0.97 } : {}}
                  style={{ padding: '8px 20px', borderRadius: 9, border: 'none', background: text.trim() ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'var(--surface-2)', color: text.trim() ? 'white' : 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed' }}>
                  Add Task
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
