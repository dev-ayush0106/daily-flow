import { describe, it, expect } from 'vitest';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { genId, nextRecurringDate } from '../hooks/useTodos';

// ── genId ─────────────────────────────────────────────────────────────────────
describe('genId', () => {
  it('returns a non-empty string', () => {
    expect(typeof genId()).toBe('string');
    expect(genId().length).toBeGreaterThan(0);
  });

  it('always generates unique IDs even when called rapidly', () => {
    const ids = Array.from({ length: 1000 }, () => genId());
    const unique = new Set(ids);
    expect(unique.size).toBe(1000);
  });

  it('has the expected format: timestamp-randomsuffix', () => {
    const id = genId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });
});

// ── nextRecurringDate ─────────────────────────────────────────────────────────
describe('nextRecurringDate', () => {
  const baseDate = '2026-04-10';

  it('returns null when recurring is "none"', () => {
    expect(nextRecurringDate(baseDate, 'none')).toBeNull();
  });

  it('returns null when dueDate is missing', () => {
    expect(nextRecurringDate(null,      'daily')).toBeNull();
    expect(nextRecurringDate(undefined, 'daily')).toBeNull();
    expect(nextRecurringDate('',        'daily')).toBeNull();
  });

  it('returns null when recurring is missing', () => {
    expect(nextRecurringDate(baseDate, null)).toBeNull();
    expect(nextRecurringDate(baseDate, undefined)).toBeNull();
  });

  it('daily → adds exactly 1 day', () => {
    const expected = format(addDays(new Date(baseDate + 'T00:00:00'), 1), 'yyyy-MM-dd');
    expect(nextRecurringDate(baseDate, 'daily')).toBe(expected);
  });

  it('weekly → adds exactly 7 days', () => {
    const expected = format(addWeeks(new Date(baseDate + 'T00:00:00'), 1), 'yyyy-MM-dd');
    expect(nextRecurringDate(baseDate, 'weekly')).toBe(expected);
  });

  it('monthly → adds exactly 1 month', () => {
    const expected = format(addMonths(new Date(baseDate + 'T00:00:00'), 1), 'yyyy-MM-dd');
    expect(nextRecurringDate(baseDate, 'monthly')).toBe(expected);
  });

  it('result is always in yyyy-MM-dd format', () => {
    const result = nextRecurringDate(baseDate, 'weekly');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('handles end-of-month correctly for monthly recurrence', () => {
    // Jan 31 + 1 month = Feb 28 (date-fns handles this)
    const result = nextRecurringDate('2026-01-31', 'monthly');
    expect(result).toBe('2026-02-28');
  });
});
