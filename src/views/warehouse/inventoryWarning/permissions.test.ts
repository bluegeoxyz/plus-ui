import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRenderer, nextTick, ssrContextKey } from 'vue';

const state = vi.hoisted(() => ({ permissions: new Set<string>() }));
const api = vi.hoisted(() => ({
  listWarnings: vi.fn(async () => ({ data: { rows: [], total: 0 } })),
  warningStatistics: vi.fn(async () => ({ data: { lowCount: 0, highCount: 0, normalCount: 0, warningCount: 0 } })),
  warningWarehouses: vi.fn(async () => ({ data: [] })),
  thresholdWarehouses: vi.fn(async () => ({ data: [] })),
  thresholdMaterials: vi.fn(async () => ({ data: [] })),
  getThreshold: vi.fn(),
  saveThreshold: vi.fn()
}));
vi.mock('@/plugins/auth', () => ({
  default: { hasPermi: (permission: string) => state.permissions.has('*:*:*') || state.permissions.has(permission) }
}));
vi.mock('@/api/warehouse/inventory/warnings', () => api);
vi.mock('@/plugins/modal', () => ({ default: { msgError: vi.fn(), msgSuccess: vi.fn() } }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('element-plus/es', () => {
  const stub = { render: () => null };
  return Object.fromEntries(
    [
      'ElRow',
      'ElCol',
      'ElCard',
      'ElStatistic',
      'ElAlert',
      'ElForm',
      'ElFormItem',
      'ElSelect',
      'ElOption',
      'ElInput',
      'ElButton',
      'ElTable',
      'ElTableColumn',
      'ElTag',
      'ElDialog',
      'ElLoadingDirective'
    ].map(name => [name, stub])
  );
});
vi.mock('@/components/Pagination/index.vue', () => ({ default: { render: () => null } }));
import InventoryWarning from './index.vue';

interface Node {
  parent: Node | null;
  children: Node[];
}
const node = (): Node => ({ parent: null, children: [] });
const renderer = createRenderer<Node, Node>({
  createElement: node,
  createText: node,
  createComment: node,
  setText: () => {},
  setElementText: () => {},
  patchProp: () => {},
  parentNode: n => n.parent,
  nextSibling: () => null,
  insert: (child, parent) => {
    child.parent = parent;
    parent.children.push(child);
  },
  remove: () => {}
});
const mount = async () => {
  const app = renderer.createApp(InventoryWarning);
  app.provide(ssrContextKey, { modules: new Set() });
  app.config.warnHandler = () => {};
  app.mount(node());
  await nextTick();
  await Promise.resolve();
  await nextTick();
  app.unmount();
};

describe('预警页面自动请求权限隔离（Vue 实际 mounted 生命周期）', () => {
  beforeEach(() => {
    state.permissions.clear();
    vi.clearAllMocks();
  });
  it('无权限不自动请求任何接口', async () => {
    await mount();
    for (const method of Object.values(api)) expect(method).not.toHaveBeenCalled();
  });
  it('只有列表权限不请求统计和编辑接口', async () => {
    state.permissions.add('warehouse:inventory:warning:list');
    await mount();
    expect(api.listWarnings).toHaveBeenCalledOnce();
    expect(api.warningWarehouses).toHaveBeenCalledOnce();
    expect(api.warningStatistics).not.toHaveBeenCalled();
    expect(api.thresholdWarehouses).not.toHaveBeenCalled();
    expect(api.getThreshold).not.toHaveBeenCalled();
  });
  it('只有编辑权限不自动请求列表或统计', async () => {
    state.permissions.add('warehouse:inventory:threshold:edit');
    await mount();
    for (const method of Object.values(api)) expect(method).not.toHaveBeenCalled();
  });
  it('超级管理员按通配权限加载查看内容但不预取编辑数据', async () => {
    state.permissions.add('*:*:*');
    await mount();
    expect(api.listWarnings).toHaveBeenCalledOnce();
    expect(api.warningStatistics).toHaveBeenCalledOnce();
    expect(api.thresholdWarehouses).not.toHaveBeenCalled();
  });
});
