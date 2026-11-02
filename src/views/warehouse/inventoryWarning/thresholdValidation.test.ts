import { describe, expect, it } from 'vitest';
import { validateThreshold } from './thresholdValidation';

describe('库存阈值精度及区间', () => {
  it.each([
    ['0', '0', 0],
    ['20.000000', '100.000000', 0],
    ['0', '100', 0],
    ['20', '0', 0],
    ['0.123456', '0.999999', 6],
    ['9999999999999.999998', '9999999999999.999999', 6]
  ])('允许合法配置 %s/%s', (lower, upper, precision) => {
    expect(validateThreshold(String(lower), String(upper), Number(precision))).toBeUndefined();
  });
  it.each([
    ['-1', '100', 0],
    ['20', '20', 0],
    ['20', '19', 0],
    ['0.1', '100', 0],
    ['0.0000001', '100', 6],
    ['10000000000000', '0', 6],
    ['', '0', 0],
    ['abc', '0', 0]
  ])('拒绝非法配置 %s/%s', (lower, upper, precision) => {
    expect(validateThreshold(String(lower), String(upper), Number(precision))).toBeTruthy();
  });
});
