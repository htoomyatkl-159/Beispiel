import { describe, expect, it } from 'vitest';
import { duration, readPage } from '../lib/api';

describe('catalog display helpers', () => {
  it('formats only supplied durations', () => {
    expect(duration(null)).toBe('—');
    expect(duration(230666)).toBe('3:50');
    expect(duration(0)).toBe('0:00');
  });
  it('normalizes invalid browser page values without forwarding them to the API', () => {
    for (const invalid of [null, '', '0', '-1', '1.2', 'wrong', '1000001']) expect(readPage(invalid)).toBe(1);
    expect(readPage('2')).toBe(2);
  });
});
