import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({ workspaceProjectOptions: vi.fn() }));
const userState = vi.hoisted(() => ({ userId: '100', permissions: [] as string[] }));
const messageMocks = vi.hoisted(() => ({ warning: vi.fn(), error: vi.fn() }));
vi.mock('@/api/property/workspace', () => apiMocks);
vi.mock('./user', () => ({ useUserStore: () => userState }));
vi.mock('element-plus', () => ({ ElMessage: messageMocks }));

import { useCurrentProjectStore } from './currentProject';

const storage = new Map<string, string>();

describe('current project workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key)
    });
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
    vi.stubGlobal(
      'CustomEvent',
      class {
        constructor(
          public type: string,
          public init?: unknown
        ) {}
      }
    );
    setActivePinia(createPinia());
    userState.userId = '100';
    userState.permissions = [];
  });

  it('does not request projects for HR-only users', async () => {
    userState.permissions = ['hr:employee:list'];

    const store = useCurrentProjectStore();
    await store.initialize();

    expect(apiMocks.workspaceProjectOptions).not.toHaveBeenCalled();
    expect(store.required).toBe(false);
    expect(store.initialized).toBe(true);
  });

  it('does not request property projects for warehouse-only users', async () => {
    userState.permissions = ['warehouse:inventory:list'];

    const store = useCurrentProjectStore();
    await store.initialize();

    expect(apiMocks.workspaceProjectOptions).not.toHaveBeenCalled();
    expect(store.required).toBe(false);
    expect(store.initialized).toBe(true);
  });

  it('keeps zero projects empty without fallback', async () => {
    userState.permissions = ['property:receivable:list'];
    apiMocks.workspaceProjectOptions.mockResolvedValue({ data: [] });

    const store = useCurrentProjectStore();
    await store.initialize();

    expect(store.candidates).toEqual([]);
    expect(store.currentProjectId).toBeUndefined();
  });

  it('automatically selects and locks one project', async () => {
    userState.permissions = ['property:payment:add'];
    apiMocks.workspaceProjectOptions.mockResolvedValue({
      data: [{ id: '9007199254740993', projectCode: 'A', projectName: '测试项目A' }]
    });

    const store = useCurrentProjectStore();
    await store.initialize();

    expect(store.currentProjectId).toBe('9007199254740993');
    expect(store.locked).toBe(true);
  });

  it('loads workspace for a finance user with only settlement permission', async () => {
    userState.permissions = ['property:collectionWriteOff:list'];
    apiMocks.workspaceProjectOptions.mockResolvedValue({
      data: [{ id: '5', projectCode: 'F', projectName: '财务项目' }]
    });
    const store = useCurrentProjectStore();
    await store.initialize();
    expect(store.required).toBe(true);
    expect(store.currentProjectId).toBe('5');
  });

  it('loads workspace for a supervisor with only review permission', async () => {
    userState.permissions = ['property:collectionReview:list'];
    apiMocks.workspaceProjectOptions.mockResolvedValue({
      data: [{ id: '4', projectCode: 'R', projectName: '审核项目' }]
    });
    const store = useCurrentProjectStore();
    await store.initialize();
    expect(store.required).toBe(true);
    expect(store.currentProjectId).toBe('4');
  });

  it('does not select the first of multiple projects', async () => {
    userState.permissions = ['property:chargeBinding:list'];
    apiMocks.workspaceProjectOptions.mockResolvedValue({
      data: [
        { id: '1', projectCode: 'A', projectName: '测试项目A' },
        { id: '2', projectCode: 'B', projectName: '测试项目B' }
      ]
    });

    const store = useCurrentProjectStore();
    await store.initialize();

    expect(store.currentProjectId).toBeUndefined();
    expect(store.locked).toBe(false);
  });

  it('restores a still-authorized saved project', async () => {
    userState.permissions = ['property:chargeBinding:list'];
    storage.set('zbm:current-project:100', '2');
    apiMocks.workspaceProjectOptions.mockResolvedValue({
      data: [
        { id: '1', projectCode: 'A', projectName: '测试项目A' },
        { id: '2', projectCode: 'B', projectName: '测试项目B' }
      ]
    });

    const store = useCurrentProjectStore();
    await store.initialize();

    expect(store.currentProjectId).toBe('2');
  });

  it('clears a saved project after its authorization is revoked', async () => {
    userState.permissions = ['property:chargeBinding:list'];
    storage.set('zbm:current-project:100', '3');
    apiMocks.workspaceProjectOptions.mockResolvedValue({
      data: [
        { id: '1', projectCode: 'A', projectName: '测试项目A' },
        { id: '2', projectCode: 'B', projectName: '测试项目B' }
      ]
    });

    const store = useCurrentProjectStore();
    await store.initialize();

    expect(store.currentProjectId).toBeUndefined();
    expect(storage.has('zbm:current-project:100')).toBe(false);
    expect(messageMocks.warning).toHaveBeenCalledWith('原工作项目已失效，请重新选择');
  });
});
