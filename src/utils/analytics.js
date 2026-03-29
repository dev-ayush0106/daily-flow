import { format, subDays, parseISO, isToday, isThisWeek } from 'date-fns';

/**
 * Build daily data points for a given number of past days.
 * Uses createdAt to bucket tasks into days.
 */
export function buildDailyData(allTasks, days) {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayTasks = allTasks.filter(t => {
      const created = t.createdAt ? format(parseISO(t.createdAt), 'yyyy-MM-dd') : null;
      return created === dayStr;
    });
    const dayCompleted = dayTasks.filter(t => t.completed).length;
    return {
      day: format(date, days <= 7 ? 'EEE' : 'MMM d'),
      fullDate: format(date, 'MMM d, yyyy'),
      date: dayStr,
      total: dayTasks.length,
      completed: dayCompleted,
      accuracy: dayTasks.length > 0 ? Math.round((dayCompleted / dayTasks.length) * 100) : 0,
    };
  });
}

/**
 * Get all distinct dates that have at least one task (created or completed).
 * Returns sorted descending (newest first).
 */
export function getAvailableDates(allTasks) {
  const dateSet = new Set();
  allTasks.forEach(t => {
    if (t.createdAt) dateSet.add(format(parseISO(t.createdAt), 'yyyy-MM-dd'));
    if (t.completedAt) dateSet.add(format(parseISO(t.completedAt), 'yyyy-MM-dd'));
  });
  return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
}

/**
 * Compute analytics for a specific single day.
 */
export function computeDayAnalytics(allTasks, dayStr) {
  const dayTasks = allTasks.filter(t => {
    const created = t.createdAt ? format(parseISO(t.createdAt), 'yyyy-MM-dd') : null;
    return created === dayStr;
  });
  const completed = dayTasks.filter(t => t.completed).length;
  const accuracy = dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0;

  const tasksWithDue = dayTasks.filter(t => t.dueDate);
  const onTime = tasksWithDue.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const due = new Date(t.dueDate + (t.dueTime ? 'T' + t.dueTime : 'T23:59:59'));
    return parseISO(t.completedAt) <= due;
  }).length;
  const concentration = tasksWithDue.length > 0
    ? Math.round((onTime / tasksWithDue.length) * 100)
    : accuracy;

  const categoryMap = {};
  dayTasks.forEach(t => {
    if (!categoryMap[t.category]) categoryMap[t.category] = { total: 0, completed: 0 };
    categoryMap[t.category].total++;
    if (t.completed) categoryMap[t.category].completed++;
  });

  return {
    tasks: dayTasks,
    total: dayTasks.length,
    completed,
    pending: dayTasks.length - completed,
    accuracy,
    concentration,
    categoryData: Object.entries(categoryMap).map(([name, d]) => ({
      name, total: d.total, completed: d.completed,
      rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
    })),
  };
}

/**
 * Main analytics computation over the full merged dataset (todos + history).
 */
export function computeAnalytics(allTasks) {
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.completed).length;
  const pending = allTasks.filter(t => !t.completed).length;

  const accuracy = total > 0 ? Math.round((completed / total) * 100) : 0;

  const tasksWithDue = allTasks.filter(t => t.dueDate);
  const onTimeCompletions = tasksWithDue.filter(t => {
    if (!t.completed || !t.completedAt || !t.dueDate) return false;
    const due = new Date(t.dueDate + (t.dueTime ? 'T' + t.dueTime : 'T23:59:59'));
    return parseISO(t.completedAt) <= due;
  }).length;

  const concentration =
    tasksWithDue.length > 0
      ? Math.round((onTimeCompletions / tasksWithDue.length) * 100)
      : accuracy;

  const categoryMap = {};
  allTasks.forEach(t => {
    if (!categoryMap[t.category]) categoryMap[t.category] = { total: 0, completed: 0 };
    categoryMap[t.category].total++;
    if (t.completed) categoryMap[t.category].completed++;
  });

  const priorityMap = { high: 0, medium: 0, low: 0 };
  allTasks.forEach(t => {
    if (priorityMap[t.priority] !== undefined) priorityMap[t.priority]++;
  });

  const todayTasks = allTasks.filter(t => t.createdAt && isToday(parseISO(t.createdAt)));
  const weekTasks = allTasks.filter(t => t.createdAt && isThisWeek(parseISO(t.createdAt)));

  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const dayStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const dayDone = allTasks.filter(t => {
      if (!t.completedAt) return false;
      return format(parseISO(t.completedAt), 'yyyy-MM-dd') === dayStr;
    }).length;
    if (dayDone > 0) streak++;
    else if (i > 0) break;
  }

  return {
    total,
    completed,
    pending,
    accuracy,
    concentration,
    categoryData: Object.entries(categoryMap).map(([name, d]) => ({
      name, total: d.total, completed: d.completed,
      rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
    })),
    priorityData: [
      { name: 'High', value: priorityMap.high, color: '#ef4444' },
      { name: 'Medium', value: priorityMap.medium, color: '#f59e0b' },
      { name: 'Low', value: priorityMap.low, color: '#10b981' },
    ],
    todayStats: {
      total: todayTasks.length,
      completed: todayTasks.filter(t => t.completed).length,
    },
    weekStats: {
      total: weekTasks.length,
      completed: weekTasks.filter(t => t.completed).length,
    },
    streak,
  };
}

export const CATEGORIES = [
  { id: 'personal', label: 'Personal', color: '#a855f7', icon: '👤' },
  { id: 'work', label: 'Work', color: '#3b82f6', icon: '💼' },
  { id: 'health', label: 'Health', color: '#10b981', icon: '💪' },
  { id: 'learning', label: 'Learning', color: '#f59e0b', icon: '📚' },
  { id: 'shopping', label: 'Shopping', color: '#ec4899', icon: '🛒' },
  { id: 'finance', label: 'Finance', color: '#06b6d4', icon: '💰' },
];

export const PRIORITIES = [
  { id: 'high', label: 'High', color: '#ef4444' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'low', label: 'Low', color: '#10b981' },
];
