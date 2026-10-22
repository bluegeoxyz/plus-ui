import { describe, expect, it } from 'vitest';
import { collectAuthorizedMenuLinks, findAuthorizedBusinessEntry } from './homeMenu';

const fullRoutes = [
  { path: '/project', meta: { title: '项目管理' }, children: [{ path: 'project', meta: { title: '项目管理' } }] },
  { path: '/resource', meta: { title: '资源管理' }, children: [{ path: 'building', meta: { title: '楼栋管理' } }] },
  { path: '/warehouse', meta: { title: '仓库管理' }, children: [{ path: 'base', children: [{ path: 'warehouse', meta: { title: '仓库管理' } }] }] }
];

describe('home authorized menu entries', () => {
  it('recursively resolves nested business pages from the full route tree', () => {
    const links = collectAuthorizedMenuLinks(fullRoutes);
    expect(links.map(item => item.path)).toEqual(['/project/project', '/resource/building', '/warehouse/base/warehouse']);
  });

  it('does not depend on a changed local sidebar tree', () => {
    const allLinks = collectAuthorizedMenuLinks(fullRoutes);
    const localSidebarLinks = collectAuthorizedMenuLinks([fullRoutes[0]]);
    expect(findAuthorizedBusinessEntry(allLinks, ['/warehouse'])?.path).toBe('/warehouse/base/warehouse');
    expect(findAuthorizedBusinessEntry(localSidebarLinks, ['/warehouse'])).toBeUndefined();
  });

  it('keeps an unauthorized business entry unavailable', () => {
    const links = collectAuthorizedMenuLinks([fullRoutes[0]]);
    expect(findAuthorizedBusinessEntry(links, ['/charge'])).toBeUndefined();
  });

  it('does not involve project context when evaluating route authorization', () => {
    const links = collectAuthorizedMenuLinks(fullRoutes);
    expect(findAuthorizedBusinessEntry(links, ['/resource'])?.title).toBe('楼栋管理');
  });
});
