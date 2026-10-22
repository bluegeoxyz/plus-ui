export interface AuthorizedMenuRoute {
  path: string;
  hidden?: boolean;
  meta?: Record<string, unknown>;
  children?: AuthorizedMenuRoute[];
}

export interface AuthorizedMenuLink {
  title: string;
  path: string;
  icon?: string;
}

export const joinMenuPath = (parent: string, child: string): string => {
  if (/^https?:\/\//.test(child) || child.startsWith('/')) return child;
  return `${parent}/${child}`.replace(/\/{2,}/g, '/');
};

export const collectAuthorizedMenuLinks = (
  routes: AuthorizedMenuRoute[],
  parentPath = ''
): AuthorizedMenuLink[] => routes.flatMap(route => {
  const currentPath = joinMenuPath(parentPath, route.path || '');
  if (route.hidden) return [];
  if (route.children?.length) return collectAuthorizedMenuLinks(route.children, currentPath);
  if (!route.meta?.title || currentPath === '/index' || /^https?:\/\//.test(currentPath)) return [];
  return [{
    title: String(route.meta.title),
    path: currentPath,
    icon: route.meta.icon ? String(route.meta.icon) : undefined
  }];
});

export const findAuthorizedBusinessEntry = (
  links: AuthorizedMenuLink[],
  pathPrefixes: string[]
): AuthorizedMenuLink | undefined => links.find(link => pathPrefixes.some(prefix => link.path === prefix || link.path.startsWith(`${prefix}/`)));

export const BUSINESS_ENTRY_PATHS = {
  project: ['/project'],
  resource: ['/resource'],
  customer: ['/customer'],
  charge: ['/charge'],
  warehouse: ['/warehouse']
} as const;
