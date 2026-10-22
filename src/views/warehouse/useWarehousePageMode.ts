import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import modal from '@/plugins/modal';
import { resolveWarehousePageEntry, resolveWarehousePageMode } from './warehousePageModePolicy';

interface WarehousePageModeOptions {
  permissionPrefix: string;
  loadList: () => void | Promise<void>;
  openAdd: () => void | Promise<void>;
  openEdit: (id: string) => void | Promise<void>;
  clearList?: () => void;
}

/** 根据功能权限与显式路由模式初始化仓库页面，不把路由参数作为授权依据。 */
export const useWarehousePageMode = (options: WarehousePageModeOptions) => {
  const route = useRoute();
  const userStore = useUserStore();
  const hasPermission = (action: string) =>
    userStore.permissions.includes('*:*:*') || userStore.permissions.includes(`${options.permissionPrefix}:${action}`);
  const canList = computed(() => hasPermission('list'));
  const canAdd = computed(() => hasPermission('add'));
  const canEdit = computed(() => hasPermission('edit'));
  const mode = computed(() => resolveWarehousePageMode(route.query.mode));

  const initialize = async () => {
    options.clearList?.();
    const rawId = Array.isArray(route.query.id) ? route.query.id[0] : route.query.id;
    const entry = resolveWarehousePageEntry(mode.value, rawId, {
      list: canList.value,
      add: canAdd.value,
      edit: canEdit.value
    });
    if (entry === 'add') {
      await options.openAdd();
      return;
    }
    if (entry === 'edit') {
      await options.openEdit(String(rawId));
      return;
    }
    if (entry === 'list') {
      await options.loadList();
      return;
    }
    if (entry === 'missing-id') return modal.msgError('编辑模式缺少目标记录 ID');
    if (mode.value === 'add') return modal.msgError('无新增权限，无法进入新增模式');
    if (mode.value === 'edit') return modal.msgError('无编辑权限，无法进入编辑模式');
    modal.msgWarning('当前账号没有列表权限；请使用已授权的新增入口或携带合法目标 ID 的编辑入口');
  };

  onMounted(initialize);
  watch(() => [route.query.mode, route.query.id], initialize);

  return { canList, canAdd, canEdit, mode, initialize };
};
