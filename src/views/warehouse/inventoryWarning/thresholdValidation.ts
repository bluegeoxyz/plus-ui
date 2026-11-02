/** 使用字符串处理 DECIMAL，避免先转换成 JS number 丢失精度。 */
export const validateThreshold = (lower: string, upper: string, precision: number): string | undefined => {
  const pattern = /^\d{1,13}(?:\.\d{1,6})?$/;
  const valid = (value: string) =>
    pattern.test(value) && (value.split('.')[1] ?? '').replace(/0+$/, '').length <= precision;
  if (!valid(lower) || !valid(upper)) return `阈值必须为非负数，整数不超过13位，有效小数不超过${precision}位`;
  const scaled = (value: string) => {
    const [integer, fraction = ''] = value.split('.');
    return BigInt(integer) * 1000000n + BigInt(fraction.padEnd(6, '0'));
  };
  const lo = scaled(lower);
  const hi = scaled(upper);
  if (lo > 0n && hi > 0n && hi <= lo) return '上下限同时启用时，上限必须大于下限';
};
