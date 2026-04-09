import { useState, useEffect, useCallback, useRef } from 'react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

const TASKS_KEY   = 'dailytodo_tasks';
const HISTORY_KEY = 'dailytodo_history';

// Fix 1: unique ID — Date.now() alone collides when called multiple times in
// the same millisecond (e.g. bulk-adding tasks from the image scanner).
function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage(key) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveToHistory(tasks) {
  const existing    = loadFromStorage(HISTORY_KEY);
  const existingIds = new Set(existing.map(t => t.id));
  const newEntries  = tasks
    .filter(t => t.completed && !existingIds.has(t.id))
    .map(t => ({ ...t, archivedAt: new Date().toISOString() }));
  if (newEntries.length > 0)
    localStorage.setItem(HISTORY_KEY, JSON.stringify([...existing, ...newEntries]));
}

function nextRecurringDate(dueDate, recurring) {
  if (!dueDate || !recurring || recurring === 'none') return null;
  const d = new Date(dueDate + 'T00:00:00');
  if (recurring === 'daily')   return format(addDays(d, 1),   'yyyy-MM-dd');
  if (recurring === 'weekly')  return format(addWeeks(d, 1),  'yyyy-MM-dd');
  if (recurring === 'monthly') return format(addMonths(d, 1), 'yyyy-MM-dd');
  return null;
}

export function useTodos() {
  const [todos,   setTodos]   = useState(() => loadFromStorage(TASKS_KEY));
  const [history, setHistory] = useState(() => loadFromStorage(HISTORY_KEY));

  // Fix 2: keep a ref that always mirrors the latest todos so that
  // deleteTodo / clearCompleted can read the current list *outside* the
  // setTodos updater function.  React StrictMode intentionally calls state
  // updater functions twice to detect side-effects — moving saveToHistory /
  // refreshHistory outside the updater ensures they run exactly once.
  const todosRef = useRef(todos);
  useEffect(() => { todosRef.current = todos; }, [todos]);

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(todos));
  }, [todos]);

  const refreshHistory = useCallback(() => {
    setHistory(loadFromStorage(HISTORY_KEY));
  }, []);

  const addTodo = useCallback((todo) => {
    const newTodo = {
      id:          genId(),           // unique even when called in a tight loop
      text:        todo.text,
      category:    todo.category  || 'personal',
      priority:    todo.priority  || 'medium',
      dueDate:     todo.dueDate   || null,
      dueTime:     todo.dueTime   || null,
      recurring:   todo.recurring || 'none',
      completed:   false,
      completedAt: null,
      createdAt:   new Date().toISOString(),
      notes:       todo.notes || '',
    };
    setTodos(prev => [newTodo, ...prev]);
    return newTodo;
  }, []);

  const toggleTodo = useCallback((id) => {
    setTodos(prev => {
      const todo = prev.find(t => t.id === id);
      if (!todo) return prev;

      const completing  = !todo.completed;
      const updatedTodo = {
        ...todo,
        completed:   completing,
        completedAt: completing ? new Date().toISOString() : null,
      };

      const updated = prev.map(t => t.id === id ? updatedTodo : t);

      if (completing && todo.recurring && todo.recurring !== 'none') {
        const nextDate = nextRecurringDate(todo.dueDate, todo.recurring);
        if (nextDate) {
          const nextTask = {
            id:          genId(),     // unique recurring task id
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
          return [nextTask, ...updated];
        }
      }
      return updated;
    });
  }, []);

  const deleteTodo = useCallback((id) => {
    // Read the task BEFORE the updater so side-effects run exactly once
    const task = todosRef.current.find(t => t.id === id);
    if (task?.completed) saveToHistory([task]);
    setTodos(prev => prev.filter(t => t.id !== id));
    refreshHistory();
  }, [refreshHistory]);

  const editTodo = useCallback((id, updates) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const clearCompleted = useCallback(() => {
    // Read completed tasks BEFORE the updater for the same reason
    const completed = todosRef.current.filter(t => t.completed);
    if (completed.length > 0) saveToHistory(completed);
    setTodos(prev => prev.filter(t => !t.completed));
    if (completed.length > 0) refreshHistory();
  }, [refreshHistory]);

  const rollForward = useCallback((ids) => {
    const todayISO  = new Date().toISOString();
    const todayDate = format(new Date(), 'yyyy-MM-dd');
    setTodos(prev =>
      prev.map(todo => {
        if (!ids.includes(todo.id)) return todo;
        return {
          ...todo,
          createdAt:         todayISO,
          dueDate:           (todo.dueDate && todo.dueDate < todayDate) ? todayDate : todo.dueDate,
          rolledForwardFrom: todo.rolledForwardFrom || todo.createdAt,
          rolledAt:          todayISO,
        };
      })
    );
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  return { todos, history, addTodo, toggleTodo, deleteTodo, editTodo, clearCompleted, rollForward, clearHistory };
}
