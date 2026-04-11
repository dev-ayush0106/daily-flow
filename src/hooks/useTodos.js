import { useState, useEffect, useCallback, useRef } from 'react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ── ID generation ────────────────────────────────────────────────────────────
export function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── DB ↔ JS mappers ──────────────────────────────────────────────────────────
function rowToTodo(r) {
  return {
    id:                r.id,
    text:              r.text,
    category:          r.category,
    priority:          r.priority,
    dueDate:           r.due_date,
    dueTime:           r.due_time,
    recurring:         r.recurring,
    completed:         r.completed,
    completedAt:       r.completed_at,
    createdAt:         r.created_at,
    notes:             r.notes,
    rolledForwardFrom: r.rolled_forward_from,
    rolledAt:          r.rolled_at,
  };
}

function todoToRow(todo, userId) {
  return {
    id:                  todo.id,
    user_id:             userId,
    text:                todo.text,
    category:            todo.category,
    priority:            todo.priority,
    due_date:            todo.dueDate   ?? null,
    due_time:            todo.dueTime   ?? null,
    recurring:           todo.recurring,
    completed:           todo.completed,
    completed_at:        todo.completedAt       ?? null,
    created_at:          todo.createdAt,
    notes:               todo.notes,
    rolled_forward_from: todo.rolledForwardFrom ?? null,
    rolled_at:           todo.rolledAt          ?? null,
  };
}

function rowToHistory(r) {
  return {
    id:          r.id,
    text:        r.text,
    category:    r.category,
    priority:    r.priority,
    dueDate:     r.due_date,
    dueTime:     r.due_time,
    recurring:   r.recurring,
    completed:   r.completed,
    completedAt: r.completed_at,
    createdAt:   r.created_at,
    archivedAt:  r.archived_at,
    notes:       r.notes,
  };
}

function historyToRow(task, userId) {
  return {
    id:          task.id,
    user_id:     userId,
    text:        task.text,
    category:    task.category,
    priority:    task.priority,
    due_date:    task.dueDate    ?? null,
    due_time:    task.dueTime    ?? null,
    recurring:   task.recurring  ?? 'none',
    completed:   task.completed,
    completed_at: task.completedAt ?? null,
    created_at:  task.createdAt,
    archived_at: task.archivedAt ?? new Date().toISOString(),
    notes:       task.notes      ?? '',
  };
}

// ── recurring helper ─────────────────────────────────────────────────────────
export function nextRecurringDate(dueDate, recurring) {
  if (!dueDate || !recurring || recurring === 'none') return null;
  const d = new Date(dueDate + 'T00:00:00');
  if (recurring === 'daily')   return format(addDays(d, 1),   'yyyy-MM-dd');
  if (recurring === 'weekly')  return format(addWeeks(d, 1),  'yyyy-MM-dd');
  if (recurring === 'monthly') return format(addMonths(d, 1), 'yyyy-MM-dd');
  return null;
}

// ── hook ─────────────────────────────────────────────────────────────────────
export function useTodos() {
  const { user } = useAuth();
  const [todos,       setTodos]       = useState([]);
  const [history,     setHistory]     = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Mirror latest todos into a ref so callbacks can read current state
  // without declaring todos as a dependency (avoids stale-closure issues
  // and prevents Supabase calls from re-creating on every render).
  const todosRef   = useRef(todos);
  const historyRef = useRef(history);
  useEffect(() => { todosRef.current   = todos;   }, [todos]);
  useEffect(() => { historyRef.current = history; }, [history]);

  // ── load data when user changes ──────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setTodos([]);
      setHistory([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    Promise.all([
      supabase.from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('todo_history')
        .select('*')
        .eq('user_id', user.id)
        .order('archived_at', { ascending: false }),
    ]).then(([{ data: td }, { data: hd }]) => {
      setTodos((td   || []).map(rowToTodo));
      setHistory((hd || []).map(rowToHistory));
      setDataLoading(false);
    });
  }, [user]);

  // ── addTodo ──────────────────────────────────────────────────────────────
  const addTodo = useCallback(async (todo) => {
    if (!user) return;
    const newTodo = {
      id:          genId(),
      text:        todo.text,
      category:    todo.category  || 'personal',
      priority:    todo.priority  || 'medium',
      dueDate:     todo.dueDate   || null,
      dueTime:     todo.dueTime   || null,
      recurring:   todo.recurring || 'none',
      completed:   false,
      completedAt: null,
      createdAt:   new Date().toISOString(),
      notes:       todo.notes     || '',
    };
    setTodos(prev => [newTodo, ...prev]);
    await supabase.from('todos').insert(todoToRow(newTodo, user.id));
    return newTodo;
  }, [user]);

  // ── toggleTodo ───────────────────────────────────────────────────────────
  const toggleTodo = useCallback(async (id) => {
    if (!user) return;

    const prev     = todosRef.current;
    const todo     = prev.find(t => t.id === id);
    if (!todo) return;

    const completing  = !todo.completed;
    const updatedTodo = {
      ...todo,
      completed:   completing,
      completedAt: completing ? new Date().toISOString() : null,
    };

    let newTodos  = prev.map(t => t.id === id ? updatedTodo : t);
    let nextTask  = null;

    if (completing && todo.recurring && todo.recurring !== 'none') {
      const nextDate = nextRecurringDate(todo.dueDate, todo.recurring);
      if (nextDate) {
        nextTask = {
          id:          genId(),
          text:        todo.text,
          category:    todo.category,
          priority:    todo.priority,
          dueDate:     nextDate,
          dueTime:     todo.dueTime,
          recurring:   todo.recurring,
          completed:   false,
          completedAt: null,
          createdAt:   new Date().toISOString(),
          notes:       todo.notes,
        };
        newTodos = [nextTask, ...newTodos];
      }
    }

    setTodos(newTodos);

    await supabase.from('todos')
      .update({ completed: updatedTodo.completed, completed_at: updatedTodo.completedAt })
      .eq('id', id).eq('user_id', user.id);

    if (nextTask) {
      await supabase.from('todos').insert(todoToRow(nextTask, user.id));
    }
  }, [user]);

  // ── deleteTodo ───────────────────────────────────────────────────────────
  const deleteTodo = useCallback(async (id) => {
    if (!user) return;
    const task = todosRef.current.find(t => t.id === id);

    setTodos(prev => prev.filter(t => t.id !== id));
    await supabase.from('todos').delete().eq('id', id).eq('user_id', user.id);

    if (task?.completed) {
      const alreadyInHistory = historyRef.current.some(h => h.id === id);
      if (!alreadyInHistory) {
        const entry = { ...task, archivedAt: new Date().toISOString() };
        await supabase.from('todo_history').insert(historyToRow(entry, user.id));
        setHistory(prev => [entry, ...prev]);
      }
    }
  }, [user]);

  // ── editTodo ─────────────────────────────────────────────────────────────
  const editTodo = useCallback(async (id, updates) => {
    if (!user) return;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    // Map camelCase → snake_case for the columns that editTodo may touch
    const colMap = { text: 'text', notes: 'notes', category: 'category', priority: 'priority', dueDate: 'due_date', dueTime: 'due_time', recurring: 'recurring' };
    const dbUpdates = {};
    Object.entries(updates).forEach(([k, v]) => { if (colMap[k]) dbUpdates[colMap[k]] = v; });

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('todos').update(dbUpdates).eq('id', id).eq('user_id', user.id);
    }
  }, [user]);

  // ── clearCompleted ───────────────────────────────────────────────────────
  const clearCompleted = useCallback(async () => {
    if (!user) return;
    const completed = todosRef.current.filter(t => t.completed);
    if (completed.length === 0) return;

    setTodos(prev => prev.filter(t => !t.completed));
    const ids = completed.map(t => t.id);
    await supabase.from('todos').delete().in('id', ids).eq('user_id', user.id);

    // Archive those not already in history
    const existingIds = new Set(historyRef.current.map(h => h.id));
    const toArchive   = completed.filter(t => !existingIds.has(t.id));
    if (toArchive.length > 0) {
      const now     = new Date().toISOString();
      const entries = toArchive.map(t => ({ ...t, archivedAt: now }));
      await supabase.from('todo_history').insert(entries.map(e => historyToRow(e, user.id)));
      setHistory(prev => [...entries, ...prev]);
    }
  }, [user]);

  // ── rollForward ──────────────────────────────────────────────────────────
  const rollForward = useCallback(async (ids) => {
    if (!user) return;
    const todayISO  = new Date().toISOString();
    const todayDate = format(new Date(), 'yyyy-MM-dd');

    const newTodos = todosRef.current.map(todo => {
      if (!ids.includes(todo.id)) return todo;
      return {
        ...todo,
        createdAt:         todayISO,
        dueDate:           (todo.dueDate && todo.dueDate < todayDate) ? todayDate : todo.dueDate,
        rolledForwardFrom: todo.rolledForwardFrom || todo.createdAt,
        rolledAt:          todayISO,
      };
    });
    setTodos(newTodos);

    await Promise.all(ids.map(id => {
      const t = newTodos.find(x => x.id === id);
      return supabase.from('todos').update({
        created_at:          t.createdAt,
        due_date:            t.dueDate,
        rolled_forward_from: t.rolledForwardFrom,
        rolled_at:           t.rolledAt,
      }).eq('id', id).eq('user_id', user.id);
    }));
  }, [user]);

  // ── clearHistory ─────────────────────────────────────────────────────────
  const clearHistory = useCallback(async () => {
    if (!user) return;
    await supabase.from('todo_history').delete().eq('user_id', user.id);
    setHistory([]);
  }, [user]);

  return {
    todos,
    history,
    dataLoading,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted,
    rollForward,
    clearHistory,
  };
}
