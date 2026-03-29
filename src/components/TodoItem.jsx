import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit3, Check, Calendar, Clock, ChevronDown, ChevronUp, FileText, Save, X, RotateCcw } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { CATEGORIES, PRIORITIES } from '../utils/analytics';

const RECURRING_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

export default function TodoItem({ todo, onToggle, onDelete, onEdit, onRollForward }) {
  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editNotes, setEditNotes] = useState(todo.notes || '');

  const cat = CATEGORIES.find(c => c.id === todo.category) || CATEGORIES[0];
  const pri = PRIORITIES.find(p => p.id === todo.priority) || PRIORITIES[1];

  const isOverdue = todo.dueDate && !todo.completed &&
    isPast(new Date(todo.dueDate + (todo.dueTime ? 'T' + todo.dueTime : 'T23:59:59')));
  const isDueToday = todo.dueDate && !todo.completed && isToday(new Date(todo.dueDate));
  const isStale = !todo.completed && todo.createdAt && !isToday(parseISO(todo.createdAt));

  const handleSave = () => {
    if (editText.trim()) onEdit(todo.id, { text: editText.trim(), notes: editNotes });
    setEditing(false);
  };

  const borderColor = isOverdue
    ? 'rgba(239,68,68,0.3)'
    : isDueToday
    ? 'rgba(245,158,11,0.3)'
    : 'var(--border)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.97, height: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: todo.completed ? 'var(--surface-1)' : 'var(--bg-card)',
        borderRadius: 14,
        border: `1px solid ${borderColor}`,
        marginBottom: 7,
        overflow: 'hidden',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Checkbox */}
        <motion.button
          onClick={() => onToggle(todo.id)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.88 }}
          style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
            border: todo.completed ? 'none' : `2px solid ${cat.color}50`,
            background: todo.completed ? `linear-gradient(135deg, ${cat.color}, ${cat.color}bb)` : `${cat.color}12`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: todo.completed ? `0 0 10px ${cat.color}40` : 'none',
          }}
        >
          <AnimatePresence>
            {todo.completed && (
              <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                <Check size={12} color="white" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div>
              <input
                autoFocus
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--border-light)', borderRadius: 7, padding: '6px 9px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', marginBottom: 7 }}
              />
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Notes..."
                rows={2}
                style={{ width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 9px', color: 'var(--text-secondary)', fontSize: 12, outline: 'none', resize: 'none', marginBottom: 7 }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: 'white', fontSize: 12, cursor: 'pointer' }}>
                  <Save size={11} /> Save
                </button>
                <button onClick={() => setEditing(false)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                  <X size={11} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Title + badges */}
              <div className="todo-badges">
                <span style={{ fontSize: 14, fontWeight: 500, color: todo.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: todo.completed ? 'line-through' : 'none', lineHeight: 1.4, marginRight: 2 }}>
                  {todo.text}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 5, background: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}30`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {cat.icon} {cat.label}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 5, background: `${pri.color}18`, color: pri.color, border: `1px solid ${pri.color}30`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  ● {pri.label}
                </span>
                {todo.recurring && todo.recurring !== 'none' && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 5, background: 'rgba(124,58,237,0.15)', color: '#a855f7', border: '1px solid rgba(124,58,237,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    ↻ {RECURRING_LABEL[todo.recurring]}
                  </span>
                )}
                {isOverdue && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 5, background: 'rgba(239,68,68,0.14)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>Overdue</span>
                )}
                {isDueToday && !isOverdue && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 5, background: 'rgba(245,158,11,0.14)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>Due Today</span>
                )}
                {isStale && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 5, background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.25)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    ↻ {format(parseISO(todo.createdAt), 'MMM d')}
                  </span>
                )}
                {todo.rolledForwardFrom && (
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, background: 'var(--surface-2)', color: 'var(--text-hint)', border: '1px solid var(--border)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    from {format(parseISO(todo.rolledForwardFrom), 'MMM d')}
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                {todo.dueDate && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: isOverdue ? '#ef4444' : 'var(--text-muted)' }}>
                    <Calendar size={10} />
                    {format(new Date(todo.dueDate), 'MMM d')}
                    {todo.dueTime && <><Clock size={10} style={{ marginLeft: 3 }} />{todo.dueTime}</>}
                  </span>
                )}
                {todo.completedAt && (
                  <span style={{ fontSize: 11, color: '#10b981bb', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Check size={10} />
                    {format(parseISO(todo.completedAt), 'MMM d, h:mm a')}
                  </span>
                )}
                {todo.notes && (
                  <button onClick={() => setExpanded(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <FileText size={10} />Notes{expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>
                )}
              </div>

              {/* Notes expand */}
              <AnimatePresence>
                {expanded && todo.notes && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ marginTop: 7, padding: '7px 10px', background: 'var(--surface-1)', borderRadius: 7, fontSize: 12, color: 'var(--text-secondary)', borderLeft: `2px solid ${cat.color}40` }}>
                      {todo.notes}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Action buttons */}
        {!editing && (
          <div style={{ display: 'flex', gap: 3, flexShrink: 0, alignItems: 'center' }}>
            {isStale && onRollForward && (
              <motion.button
                onClick={() => onRollForward([todo.id])}
                whileHover={{ scale: 1.08, boxShadow: '0 0 10px rgba(251,146,60,0.4)' }}
                whileTap={{ scale: 0.9 }}
                title="Move to today"
                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(251,146,60,0.28)', background: 'rgba(251,146,60,0.1)', color: '#fb923c', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <RotateCcw size={10} /> Today
              </motion.button>
            )}
            <motion.button onClick={() => setEditing(true)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', padding: 5, borderRadius: 6, transition: 'color 0.15s' }}>
              <Edit3 size={14} />
            </motion.button>
            <motion.button onClick={() => onDelete(todo.id)} whileHover={{ scale: 1.15, color: '#ef4444' }} whileTap={{ scale: 0.9 }}
              style={{ background: 'none', border: 'none', color: 'var(--text-hint)', cursor: 'pointer', padding: 5, borderRadius: 6, transition: 'color 0.15s' }}>
              <Trash2 size={14} />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
