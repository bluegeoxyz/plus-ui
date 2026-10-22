<template>
  <el-select
    :model-value="store.currentProjectId"
    class="current-project-switcher"
    filterable
    :disabled="store.locked || !store.candidates.length"
    :loading="store.loading"
    :placeholder="store.candidates.length ? '选择工作项目' : '暂无可用项目'"
    @change="changeProject"
  >
    <el-option v-for="item in store.candidates" :key="item.id" :label="item.projectShortName || item.projectName" :value="item.id" />
  </el-select>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus';
import { useCurrentProjectStore } from '@/store/modules/currentProject';

const store = useCurrentProjectStore();
const changeProject = async (id?: string) => {
  if (!id || id === store.currentProjectId) return;
  if (store.currentProjectId) {
    try {
      await ElMessageBox.confirm('切换工作项目将使当前页面的下级筛选失效，请确认已保存正在编辑的内容。', '切换工作项目', {
        confirmButtonText: '确认切换',
        cancelButtonText: '取消',
        type: 'warning'
      });
    } catch {
      return;
    }
  }
  try {
    store.selectProject(id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '项目切换失败');
  }
};
</script>

<style scoped>.current-project-switcher { width: 180px; }</style>
