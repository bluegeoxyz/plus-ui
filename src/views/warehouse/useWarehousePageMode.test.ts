import { describe, expect, it } from 'vitest';
import { resolveWarehousePageEntry, resolveWarehousePageMode } from './warehousePageModePolicy';

describe('warehouse page operation mode', () => {
  it('accepts only the declared add and edit modes', () => {
    expect(resolveWarehousePageMode('add')).toBe('add');
    expect(resolveWarehousePageMode('edit')).toBe('edit');
  });

  it('falls back to list for absent or forged modes', () => {
    expect(resolveWarehousePageMode(undefined)).toBe('list');
    expect(resolveWarehousePageMode('query')).toBe('list');
    expect(resolveWarehousePageMode(['edit'])).toBe('list');
  });

  it('keeps list, add and edit permissions independent', () => {
    expect(resolveWarehousePageEntry('add', undefined, { list: false, add: true, edit: false })).toBe('add');
    expect(resolveWarehousePageEntry('edit', '42', { list: false, add: false, edit: true })).toBe('edit');
    expect(resolveWarehousePageEntry('list', undefined, { list: true, add: false, edit: false })).toBe('list');
    expect(resolveWarehousePageEntry('edit', '42', { list: true, add: false, edit: false })).toBe('forbidden');
  });

  it('rejects missing edit ids and unauthorized manual modes', () => {
    expect(resolveWarehousePageEntry('edit', undefined, { list: false, add: false, edit: true })).toBe('missing-id');
    expect(resolveWarehousePageEntry('add', undefined, { list: true, add: false, edit: false })).toBe('forbidden');
    expect(resolveWarehousePageEntry('list', undefined, { list: false, add: true, edit: true })).toBe('forbidden');
  });
});
