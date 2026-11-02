/** 金额全程以字符串和整数分计算，避免浮点相加及大金额精度损失。 */
export const cents = (value: string | number): bigint => {
  const text = String(value ?? '');
  if (!/^\d{1,16}(\.\d{1,2})?$/.test(text)) throw new Error('金额必须为最多两位小数的非负数');
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};
export const decimal = (value: bigint): string => `${value / 100n}.${(value % 100n).toString().padStart(2, '0')}`;
export const totalAmount = (values: string[]): string => decimal(values.reduce((sum, value) => sum + cents(value), 0n));
