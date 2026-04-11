import { describe, it, expect } from 'vitest';
import { parseLines } from '../utils/imageToTasks';

describe('parseLines', () => {
  it('splits text into one entry per non-empty line', () => {
    const result = parseLines('Buy milk\nCall dentist\nPay bills');
    expect(result).toEqual(['Buy milk', 'Call dentist', 'Pay bills']);
  });

  it('removes leading bullet points', () => {
    const result = parseLines('• Buy milk\n· Call dentist\n▪ Pay bills');
    expect(result).toEqual(['Buy milk', 'Call dentist', 'Pay bills']);
  });

  it('removes leading dashes and asterisks', () => {
    const result = parseLines('- Buy milk\n* Call dentist\n> Pay bills');
    expect(result).toEqual(['Buy milk', 'Call dentist', 'Pay bills']);
  });

  it('removes checkbox markers [ ] and [x]', () => {
    const result = parseLines('[ ] Buy milk\n[x] Call dentist\n[X] Pay bills');
    expect(result).toEqual(['Buy milk', 'Call dentist', 'Pay bills']);
  });

  it('removes numbered list prefixes like "1." and "2)"', () => {
    const result = parseLines('1. Buy milk\n2. Call dentist\n3) Pay bills');
    expect(result).toEqual(['Buy milk', 'Call dentist', 'Pay bills']);
  });

  it('filters out lines shorter than 3 characters (noise)', () => {
    const result = parseLines('ok\nBuy milk\nab\nCall dentist');
    expect(result).toEqual(['Buy milk', 'Call dentist']);
  });

  it('filters out blank lines', () => {
    const result = parseLines('Buy milk\n\n\nCall dentist');
    expect(result).toEqual(['Buy milk', 'Call dentist']);
  });

  it('trims surrounding whitespace from each line', () => {
    const result = parseLines('  Buy milk  \n   Call dentist   ');
    expect(result).toEqual(['Buy milk', 'Call dentist']);
  });

  it('returns empty array for empty string', () => {
    expect(parseLines('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(parseLines('   \n  \n  ')).toEqual([]);
  });

  it('handles mixed formats in one block of text', () => {
    const text = [
      '1. Buy groceries',
      '• Call the dentist',
      '[ ] Submit report',
      '[x] Send invoice',
      '- Clean the house',
    ].join('\n');
    const result = parseLines(text);
    expect(result).toEqual([
      'Buy groceries',
      'Call the dentist',
      'Submit report',
      'Send invoice',
      'Clean the house',
    ]);
  });
});
