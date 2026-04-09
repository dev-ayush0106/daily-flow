import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Inbox } from 'lucide-react';
import TodoItem from './TodoItem';
import AddTodo from './AddTodo';
import RolloverBanner from './RolloverBanner';
import ImageTaskExtractor from './ImageTaskExtractor';
import { CATEGORIES } from '../utils/analytics';
import { isToday, parseISO } from 'date-fns';

export default function TodoList({ todos, onAdd, onToggle, onDelete, onEdit, onClearCompleted, onRollForward }) {
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy,       setSortBy]       = useState('created');

  const filtered = useMemo(() => {
    let list = [...todos];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.text.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q));
    }
    if (filterCat !== 'all')      list = list.filter(t => t.category === filterCat);
    if (filterStatus === 'active')    list = list.filter(t => !t.completed);
    else if (filterStatus === 'completed') list = list.filter(t => t.completed);
    else if (filterStatus === 'today')     list = list.filter(t => t.createdAt && isToday(parseISO(t.createdAt)));

    list.sort((a, b) => {
      if (sortBy === 'priority') {
        const o = { high: 0, medium: 1, low: 2 };
        return o[a.priority] - o[b.priority];
      }
      if (sortBy === 'due') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  }, [todos, search, filterCat, filterStatus, sortBy]);

  const active         = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t =>  t.completed).length;

  const selectStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    borderRadius: 9,
    padding: '7px 10px',
    fontSize: 12,
    outline: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <AddTodo onAdd={onAdd} />
        </div>
        <ImageTaskExtractor onAdd={onAdd} />
      </div>
      <RolloverBanner todos={todos} onRollForward={onRollForward} />

      {/* Stats strip */}
      <div className="stats-strip" style={{ marginBottom: 16 }}>
        {[
          { label: 'Total',  value: todos.length,    color: '#a855f7' },
          { label: 'Active', value: active,           color: '#3b82f6' },
          { label: 'Done',   value: completedCount,   color: '#10b981' },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -2 }} style={{
            flex: 1, background: 'var(--bg-card)', borderRadius: 11, padding: '10px 14px',
            border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="filter-search" style={{
          flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--bg-card)', borderRadius: 9, border: '1px solid var(--border)', padding: '7px 11px',
        }}>
          <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, width: '100%', minWidth: 0 }}
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="all">All Tasks</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="today">Today</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={selectStyle}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
          <option value="created">Newest First</option>
          <option value="priority">By Priority</option>
          <option value="due">By Due Date</option>
        </select>
      </div>

      {/* Clear completed */}
      {completedCount > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <button
            onClick={onClearCompleted}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: 'rgba(239,68,68,0.65)', borderRadius: 8, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
          >
            <Trash2 size={11} /> Clear {completedCount} completed
          </button>
        </motion.div>
      )}

      {/* List */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', color: 'var(--text-hint)', gap: 10 }}
          >
            <Inbox size={40} strokeWidth={1} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {search || filterCat !== 'all' || filterStatus !== 'all' ? 'No tasks match your filters' : 'No tasks yet — add your first task above!'}
            </div>
          </motion.div>
        ) : (
          filtered.map(todo => (
            <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onRollForward={onRollForward} />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
