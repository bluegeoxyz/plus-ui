import type { RouteRecordName, RouteRecordRaw, Router } from 'vue-router';

const collectRouteNames = (routes: RouteRecordRaw[]): RouteRecordName[] => routes.flatMap(route => [
  ...(route.name ? [route.name] : []),
  ...collectRouteNames(route.children ?? [])
]);

export const createDynamicRouteRegistry = (router: Pick<Router, 'addRoute'>) => {
  let removers: Array<() => void> = [];
  let names: RouteRecordName[] = [];

  const removeAll = () => {
    removers.toReversed().forEach(remove => remove());
    removers = [];
    names = [];
  };

  const register = (routes: RouteRecordRaw[]) => {
    removeAll();
    removers = routes.map(route => router.addRoute(route));
    names = collectRouteNames(routes);
  };

  return { register, removeAll, getNames: () => [...names] };
};

export const createLatestRequestGuard = () => {
  let version = 0;
  return {
    begin: () => ++version,
    isCurrent: (requestVersion: number) => requestVersion === version,
    invalidate: () => ++version
  };
};
