import { describe, it, expect } from 'vitest';
import { format, subDays } from 'date-fns';
import {
  computeAnalytics,
  buildDailyData,
  computeDayAnalytics,
  CATEGORIES,
  PRIORITIES,
} from '../utils/analytics';

// ── helper to build a fake task ───────────────────────────────────────────────
function makeTask(overrides = {}) {
  return {
    id:          Math.random().toString(36).slice(2),
    text:        'Test task',
    category:    'personal',
    priority:    'medium',
    dueDate:     null,
    dueTime:     null,
    completed:   false,
    completedAt: null,
    createdAt:   new Date().toISOString(),
    notes:       '',
    ...overrides,
  };
}

function today(hoursOffset = 0) {
  const d = new Date();
  d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
}

function daysAgo(n) {
  return subDays(new Date(), n).toISOString();
}

function dateStr(n = 0) {
  return format(subDays(new Date(), n), 'yyyy-MM-dd');
}

// ── computeAnalytics ──────────────────────────────────────────────────────────
describe('computeAnalytics', () => {
  it('returns zeros for an empty task list', () => {
    const r = computeAnalytics([]);
    expect(r.total).toBe(0);
    expect(r.completed).toBe(0);
    expect(r.pending).toBe(0);
    expect(r.accuracy).toBe(0);
    expect(r.streak).toBe(0);
  });

  it('counts total, completed and pending correctly', () => {
    const tasks = [
      makeTask({ completed: true,  completedAt: today() }),
      makeTask({ completed: true,  completedAt: today() }),
      makeTask({ completed: false }),
    ];
    const r = computeAnalytics(tasks);
    expect(r.total).toBe(3);
    expect(r.completed).toBe(2);
    expect(r.pending).toBe(1);
  });

  it('calculates accuracy as percentage of completed / total', () => {
    const tasks = [
      makeTask({ completed: true,  completedAt: today() }),
      makeTask({ completed: false }),
      makeTask({ completed: false }),
      makeTask({ completed: false }),
    ];
    const r = computeAnalytics(tasks);
    expect(r.accuracy).toBe(25); // 1 out of 4
  });

  it('accuracy is 100 when all tasks are completed', () => {
    const tasks = [
      makeTask({ completed: true, completedAt: today() }),
      makeTask({ completed: true, completedAt: today() }),
    ];
    expect(computeAnalytics(tasks).accuracy).toBe(100);
  });

  it('calculates streak — consecutive days with at least one completion', () => {
    const tasks = [
      makeTask({ completed: true, completedAt: daysAgo(0) }), // today
      makeTask({ completed: true, completedAt: daysAgo(1) }), // yesterday
      makeTask({ completed: true, completedAt: daysAgo(2) }), // 2 days ago
      // gap on day 3
      makeTask({ completed: true, completedAt: daysAgo(4) }), // should not count
    ];
    expect(computeAnalytics(tasks).streak).toBe(3);
  });

  it('streak is 0 when nothing was completed today or yesterday', () => {
    const tasks = [
      makeTask({ completed: true, completedAt: daysAgo(5) }),
    ];
    expect(computeAnalytics(tasks).streak).toBe(0);
  });

  it('groups priority counts correctly', () => {
    const tasks = [
      makeTask({ priority: 'high' }),
      makeTask({ priority: 'high' }),
      makeTask({ priority: 'medium' }),
      makeTask({ priority: 'low' }),
    ];
    const r = computeAnalytics(tasks);
    const high   = r.priorityData.find(p => p.name === 'High');
    const medium = r.priorityData.find(p => p.name === 'Medium');
    const low    = r.priorityData.find(p => p.name === 'Low');
    expect(high.value).toBe(2);
    expect(medium.value).toBe(1);
    expect(low.value).toBe(1);
  });

  it('groups category counts correctly', () => {
    const tasks = [
      makeTask({ category: 'work',     completed: true,  completedAt: today() }),
      makeTask({ category: 'work',     completed: false }),
      makeTask({ category: 'personal', completed: true,  completedAt: today() }),
    ];
    const r = computeAnalytics(tasks);
    const work = r.categoryData.find(c => c.name === 'work');
    expect(work.total).toBe(2);
    expect(work.completed).toBe(1);
    expect(work.rate).toBe(50);
  });

  it('concentration equals accuracy when no tasks have a due date', () => {
    const tasks = [
      makeTask({ completed: true,  completedAt: today() }),
      makeTask({ completed: false }),
    ];
    const r = computeAnalytics(tasks);
    expect(r.concentration).toBe(r.accuracy);
  });

  it('concentration is 100 when all due tasks are completed on time', () => {
    const due = dateStr(0); // today
    const tasks = [
      makeTask({ completed: true, completedAt: today(-1), dueDate: due, dueTime: '23:59' }),
    ];
    expect(computeAnalytics(tasks).concentration).toBe(100);
  });
});

// ── buildDailyData ────────────────────────────────────────────────────────────
describe('buildDailyData', () => {
  it('returns the correct number of data points', () => {
    expect(buildDailyData([], 7).length).toBe(7);
    expect(buildDailyData([], 30).length).toBe(30);
  });

  it('last entry is always today', () => {
    const data = buildDailyData([], 7);
    expect(data[6].date).toBe(dateStr(0));
  });

  it('buckets tasks into the correct day', () => {
    const tasks = [
      makeTask({ createdAt: daysAgo(1), completed: true,  completedAt: daysAgo(1) }),
      makeTask({ createdAt: daysAgo(1), completed: false }),
    ];
    const data = buildDailyData(tasks, 7);
    const yesterday = data.find(d => d.date === dateStr(1));
    expect(yesterday.total).toBe(2);
    expect(yesterday.completed).toBe(1);
    expect(yesterday.accuracy).toBe(50);
  });

  it('accuracy is 0 when no tasks exist for a day', () => {
    const data = buildDailyData([], 7);
    data.forEach(d => expect(d.accuracy).toBe(0));
  });
});

// ── computeDayAnalytics ───────────────────────────────────────────────────────
describe('computeDayAnalytics', () => {
  it('only includes tasks created on the given day', () => {
    const tasks = [
      makeTask({ createdAt: daysAgo(0) }),
      makeTask({ createdAt: daysAgo(1) }),
      makeTask({ createdAt: daysAgo(2) }),
    ];
    const r = computeDayAnalytics(tasks, dateStr(0));
    expect(r.total).toBe(1);
  });

  it('returns pending = total - completed', () => {
    const tasks = [
      makeTask({ createdAt: daysAgo(0), completed: true, completedAt: today() }),
      makeTask({ createdAt: daysAgo(0), completed: false }),
      makeTask({ createdAt: daysAgo(0), completed: false }),
    ];
    const r = computeDayAnalytics(tasks, dateStr(0));
    expect(r.pending).toBe(2);
    expect(r.completed).toBe(1);
  });
});

// ── CATEGORIES and PRIORITIES constants ──────────────────────────────────────
describe('CATEGORIES', () => {
  it('contains exactly 6 categories', () => {
    expect(CATEGORIES.length).toBe(6);
  });

  it('every category has id, label, color and icon', () => {
    CATEGORIES.forEach(c => {
      expect(c.id).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.color).toMatch(/^#/);
      expect(c.icon).toBeTruthy();
    });
  });
});

describe('PRIORITIES', () => {
  it('contains high, medium and low', () => {
    const ids = PRIORITIES.map(p => p.id);
    expect(ids).toContain('high');
    expect(ids).toContain('medium');
    expect(ids).toContain('low');
  });
});
