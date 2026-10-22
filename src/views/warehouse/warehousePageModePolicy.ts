export type WarehousePageMode = 'list' | 'add' | 'edit';
export type WarehousePageEntry = 'list' | 'add' | 'edit' | 'forbidden' | 'missing-id';

export const resolveWarehousePageMode = (mode: unknown): WarehousePageMode => {
  if (mode === 'add' || mode === 'edit') return mode;
  return 'list';
};

export const resolveWarehousePageEntry = (
  mode: WarehousePageMode,
  id: unknown,
  permissions: { list: boolean; add: boolean; edit: boolean }
): WarehousePageEntry => {
  if (mode === 'add') return permissions.add ? 'add' : 'forbidden';
  if (mode === 'edit') {
    if (!permissions.edit) return 'forbidden';
    return typeof id === 'string' && id.length > 0 ? 'edit' : 'missing-id';
  }
  return permissions.list ? 'list' : 'forbidden';
};
