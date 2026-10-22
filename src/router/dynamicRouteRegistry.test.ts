import type { RouteRecordRaw } from 'vue-router';
import { describe, expect, it, vi } from 'vitest';
import { createDynamicRouteRegistry, createLatestRequestGuard } from './dynamicRouteRegistry';

const adminRoutes: RouteRecordRaw[] = [{
  path: '/system', name: 'System', component: {} as RouteRecordRaw['component'],
  children: [{ path: 'user', name: 'User', component: {} as RouteRecordRaw['component'] }]
}];
const normalRoutes: RouteRecordRaw[] = [{ path: '/profile', name: 'Profile', component: {} as RouteRecordRaw['component'] }];

describe('dynamic route lifecycle', () => {
  it('removes SuperAdmin routes before registering a normal account', () => {
    const removed: string[] = [];
    const addRoute = vi.fn((route: RouteRecordRaw) => () => removed.push(String(route.name)));
    const registry = createDynamicRouteRegistry({ addRoute } as never);
    registry.register(adminRoutes);
    expect(registry.getNames()).toEqual(['System', 'User']);
    registry.register(normalRoutes);
    expect(removed).toEqual(['System']);
    expect(registry.getNames()).toEqual(['Profile']);
  });

  it('supports repeated logout and login without retaining old routes', () => {
    const remove = vi.fn();
    const registry = createDynamicRouteRegistry({ addRoute: vi.fn(() => remove) } as never);
    registry.register(normalRoutes);
    registry.removeAll();
    registry.removeAll();
    expect(remove).toHaveBeenCalledOnce();
    expect(registry.getNames()).toEqual([]);
  });

  it('invalidates an older asynchronous route response after logout', () => {
    const guard = createLatestRequestGuard();
    const oldRequest = guard.begin();
    guard.invalidate();
    const newRequest = guard.begin();
    expect(guard.isCurrent(oldRequest)).toBe(false);
    expect(guard.isCurrent(newRequest)).toBe(true);
  });
});
