import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { workspaceProjectOptions } from '@/api/property/workspace';
import type { WorkspaceProjectOptionVO } from '@/api/property/workspace/types';
import { useUserStore } from './user';
import { requiresPropertyWorkspace } from './currentProjectPolicy';

const storageKey = (userId: string | number) => `zbm:current-project:${userId}`;

/** Working context for PROJECT_BASE business pages. It is a UI preference, never an authorization source. */
export const useCurrentProjectStore = defineStore('currentProject', () => {
  const currentProjectId = ref<string>();
  const currentProjectName = ref('');
  const candidates = ref<WorkspaceProjectOptionVO[]>([]);
  const loading = ref(false);
  const initialized = ref(false);
  const required = ref(false);
  const locked = computed(() => required.value && candidates.value.length === 1);
  let requestVersion = 0;

  const clearCurrentProject = () => {
    currentProjectId.value = undefined;
    currentProjectName.value = '';
  };

  const loadAvailableProjects = async () => {
    const version = ++requestVersion;
    loading.value = true;
    try {
      const response = await workspaceProjectOptions();
      if (version !== requestVersion) return;
      candidates.value = response.data || [];
    } finally {
      if (version === requestVersion) loading.value = false;
    }
  };

  const selectProject = (projectId?: string) => {
    const userId = useUserStore().userId;
    const target = candidates.value.find(item => String(item.id) === String(projectId));
    if (!target) throw new Error('该项目已不在当前业务域的可用范围内');
    currentProjectId.value = target.id;
    currentProjectName.value = target.projectShortName || target.projectName;
    localStorage.setItem(storageKey(userId), String(target.id));
    window.dispatchEvent(new CustomEvent('zbm:current-project-changed', { detail: { projectId: target.id } }));
  };

  const validateCurrentProject = (notifyInvalid = false) => {
    const userId = useUserStore().userId;
    const saved = localStorage.getItem(storageKey(userId));
    const target = candidates.value.find(item => String(item.id) === String(currentProjectId.value ?? saved));
    if (!target) {
      const hadSelection = Boolean(currentProjectId.value ?? saved);
      clearCurrentProject();
      localStorage.removeItem(storageKey(userId));
      if (notifyInvalid && hadSelection) ElMessage.warning('原工作项目已失效，请重新选择');
      return false;
    }
    currentProjectId.value = target.id;
    currentProjectName.value = target.projectShortName || target.projectName;
    return true;
  };

  const initialize = async () => {
    const userStore = useUserStore();
    required.value = requiresPropertyWorkspace(userStore.permissions);
    if (!required.value) {
      requestVersion++;
      clearCurrentProject();
      candidates.value = [];
      initialized.value = true;
      return;
    }
    await loadAvailableProjects();
    if (!validateCurrentProject(true) && candidates.value.length === 1) selectProject(candidates.value[0].id);
    initialized.value = true;
  };

  const refreshAvailableProjects = async () => {
    await loadAvailableProjects();
    if (!validateCurrentProject(true) && candidates.value.length === 1) selectProject(candidates.value[0].id);
  };

  const reset = () => {
    requestVersion++;
    clearCurrentProject();
    candidates.value = [];
    required.value = false;
    initialized.value = false;
  };

  return {
    currentProjectId,
    currentProjectName,
    candidates,
    loading,
    initialized,
    required,
    locked,
    initialize,
    loadAvailableProjects,
    selectProject,
    validateCurrentProject,
    clearCurrentProject,
    refreshAvailableProjects,
    reset
  };
});
