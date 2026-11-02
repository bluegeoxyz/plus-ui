import { describe, expect, it } from 'vitest';
import { cents, totalAmount } from './money';
describe('collection amounts', () => {
  it('sums exact cents and large amounts without floating point', () => {
    expect(totalAmount(['0.10', '0.20'])).toBe('0.30');
    expect(totalAmount(['9999999999999999.98', '0.01'])).toBe('9999999999999999.99');
    expect(cents('12')).toBe(1200n);
  });
  it('rejects invalid precision, negative values and scientific notation', () => {
    for (const value of ['1.001', '-1', '1e3', 'NaN', '']) expect(() => cents(value)).toThrow();
  });
});
