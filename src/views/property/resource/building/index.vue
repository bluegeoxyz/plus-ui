<template>
  <div class="p-2 app-container building-page">
    <el-alert
      v-if="!currentProjectId"
      title="请先在顶部选择当前物业项目"
      description="选择项目后才能查询和维护该项目下的楼栋。"
      type="info"
      :closable="false"
      show-icon
      class="mb-2"
    />

    <el-alert
      v-else-if="resourcePermissionInvalid"
      title="当前项目的楼栋访问权限已失效"
      description="请在顶部项目切换器中重新选择一个具有资源访问权限的项目。"
      type="warning"
      :closable="false"
      show-icon
      class="mb-2"
    />

    <template v-else>
      <el-card v-show="showSearch" shadow="hover" class="mb-2">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item label="楼栋编码" prop="buildingCode">
            <el-input
              v-model="queryParams.buildingCode"
              clearable
              placeholder="请输入楼栋编码"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="楼栋名称" prop="buildingName">
            <el-input
              v-model="queryParams.buildingName"
              clearable
              placeholder="请输入楼栋名称"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" clearable placeholder="请选择状态">
              <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <el-row :gutter="10" class="mb-2">
            <el-col :span="1.5">
              <el-button v-hasPermi="['property:building:add']" type="primary" plain icon="Plus" @click="handleAdd">
                新增
              </el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button
                v-hasPermi="['property:building:edit']"
                type="success"
                plain
                icon="Edit"
                :disabled="single"
                @click="handleUpdate()"
              >
                修改
              </el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button
                v-hasPermi="['property:building:remove']"
                type="danger"
                plain
                icon="Delete"
                :disabled="multiple"
                @click="handleDelete()"
              >
                删除
              </el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button v-hasPermi="['property:building:export']" type="warning" plain icon="Download" @click="handleExport">
                导出
              </el-button>
            </el-col>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </el-row>
        </template>

        <el-table v-loading="loading" border :data="buildingList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="楼栋编码" prop="buildingCode" min-width="120">
            <template #default="scope">
              <el-button v-hasPermi="['property:building:query']" link type="primary" @click="handleDetail(scope.row)">
                {{ scope.row.buildingCode }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="楼栋名称" prop="buildingName" min-width="150" show-overflow-tooltip />
          <el-table-column label="楼栋类型" prop="buildingType" width="120">
            <template #default="scope"><dict-tag :options="pm_building_type" :value="scope.row.buildingType" /></template>
          </el-table-column>
          <el-table-column label="地上层数" prop="aboveGroundFloors" width="100" align="center" />
          <el-table-column label="地下层数" prop="undergroundFloors" width="100" align="center" />
          <el-table-column label="排序" prop="sort" width="80" align="center" />
          <el-table-column label="状态" prop="status" width="90" align="center">
            <template #default="scope">
              <el-switch
                v-model="scope.row.status"
                v-hasPermi="['property:building:edit']"
                active-value="0"
                inactive-value="1"
                @change="handleStatusChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template #default="scope">
              <el-tooltip content="详情" placement="top">
                <el-button v-hasPermi="['property:building:query']" link type="primary" icon="View" @click="handleDetail(scope.row)" />
              </el-tooltip>
              <el-tooltip content="修改" placement="top">
                <el-button v-hasPermi="['property:building:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button v-hasPermi="['property:building:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)" />
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="total > 0"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          :total="total"
          @pagination="getList"
        />
      </el-card>
    </template>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" append-to-body>
      <el-form ref="buildingFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="楼栋编码" prop="buildingCode">
              <el-input v-model="form.buildingCode" maxlength="32" placeholder="请输入楼栋编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="楼栋名称" prop="buildingName">
              <el-input v-model="form.buildingName" maxlength="64" placeholder="请输入楼栋名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="楼栋类型" prop="buildingType">
              <el-select v-model="form.buildingType" clearable placeholder="请选择楼栋类型">
                <el-option v-for="dict in pm_building_type" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示顺序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地上层数" prop="aboveGroundFloors">
              <el-input-number v-model="form.aboveGroundFloors" :min="0" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地下层数" prop="undergroundFloors">
              <el-input-number v-model="form.undergroundFloors" :min="0" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status"><el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio></el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
        <el-button @click="cancel">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="楼栋详情" width="640px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="楼栋编码">{{ detail.buildingCode }}</el-descriptions-item>
        <el-descriptions-item label="楼栋名称">{{ detail.buildingName }}</el-descriptions-item>
        <el-descriptions-item label="楼栋类型"><dict-tag :options="pm_building_type" :value="detail.buildingType" /></el-descriptions-item>
        <el-descriptions-item label="显示顺序">{{ detail.sort ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="地上层数">{{ detail.aboveGroundFloors ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="地下层数">{{ detail.undergroundFloors ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="sys_normal_disable" :value="detail.status" /></el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="Building" lang="ts">
import type { BuildingForm, BuildingQuery, BuildingVO } from '@/api/property/resource/building/types';
import {
  addBuilding,
  changeBuildingStatus,
  delBuilding,
  exportBuilding,
  getBuilding,
  listBuilding,
  resourceProjectOptions,
  updateBuilding
} from '@/api/property/resource/building';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import modal from '@/plugins/modal';
import { useCurrentProjectStore } from '@/store/modules/currentProject';
import { useDict } from '@/utils/dict';

const { pm_building_type, sys_normal_disable } = toRefs<any>(useDict('pm_building_type', 'sys_normal_disable'));

const currentProjectStore = useCurrentProjectStore();
const currentProjectId = computed(() => currentProjectStore.currentProjectId);
const buildingList = ref<BuildingVO[]>([]);
const detail = ref<BuildingVO>();
const detailVisible = ref(false);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const loading = ref(false);
const submitLoading = ref(false);
const dialogProjectId = ref<number | string>();
const resourcePermissionInvalid = ref(false);
const resourceValidatedProjectId = ref<number | string>();
const pageActive = ref(true);
let requestVersion = 0;
let activationCount = 0;
const { showSearch } = useSearchToggle();
const queryFormRef = ref<ElFormInstance>();
const buildingFormRef = ref<ElFormInstance>();

const initFormData = (): BuildingForm => ({
  id: undefined,
  projectId: undefined,
  buildingCode: '',
  buildingName: '',
  buildingType: undefined,
  aboveGroundFloors: undefined,
  undergroundFloors: undefined,
  sort: 0,
  status: '0',
  remark: ''
});

const data = reactive<PageData<BuildingForm, BuildingQuery>>({
  form: initFormData(),
  queryParams: { pageNum: 1, pageSize: 10, buildingCode: undefined, buildingName: undefined, status: undefined },
  rules: {
    buildingCode: [
      { required: true, message: '楼栋编码不能为空', trigger: 'blur' },
      { max: 32, message: '楼栋编码长度不能超过32个字符', trigger: 'blur' }
    ],
    buildingName: [
      { required: true, message: '楼栋名称不能为空', trigger: 'blur' },
      { max: 64, message: '楼栋名称长度不能超过64个字符', trigger: 'blur' }
    ]
  }
});
const { queryParams, form, rules } = toRefs(data);
const { dialog, resetForm, openDialog, showDialog, closeDialog } = useFormDialog({
  form,
  formRef: buildingFormRef,
  initialFormData: initFormData()
});

const clearList = () => {
  buildingList.value = [];
  total.value = 0;
  ids.value = [];
  single.value = true;
  multiple.value = true;
};

const resetProjectState = () => {
  clearList();
  cancel();
  detail.value = undefined;
  detailVisible.value = false;
};

const invalidateRequests = () => {
  requestVersion += 1;
  loading.value = false;
};

const isCurrentRequest = (version: number, projectId: number | string) =>
  pageActive.value && version === requestVersion && String(currentProjectId.value) === String(projectId);

const isBusinessPermissionError = (error: unknown) =>
  error instanceof Error && error.message.includes('无项目业务访问权限');

const validateResourceProject = async (projectId: number | string, version: number) => {
  const res = await resourceProjectOptions();
  if (!isCurrentRequest(version, projectId)) return false;
  const allowed = (res.data || []).some(project => String(project.id) === String(projectId));
  resourceValidatedProjectId.value = allowed ? projectId : undefined;
  resourcePermissionInvalid.value = !allowed;
  if (!allowed) resetProjectState();
  return allowed;
};

const handleBusinessPermissionRevoked = async (projectId: number | string, version: number) => {
  resetProjectState();
  try {
    const allowed = await validateResourceProject(projectId, version);
    if (isCurrentRequest(version, projectId) && !allowed) {
      modal.msgWarning('当前项目的楼栋访问权限已失效，请重新选择项目');
    }
  } catch {
    // 候选重验失败时不把网络或服务异常误判为权限撤销。
  }
};

const handleOperationPermissionError = async (error: unknown) => {
  const projectId = currentProjectId.value;
  if (!projectId || !isBusinessPermissionError(error)) return;
  const version = ++requestVersion;
  await handleBusinessPermissionRevoked(projectId, version);
};

const getList = async () => {
  const projectId = currentProjectId.value;
  const version = ++requestVersion;
  if (!projectId) {
    resetProjectState();
    resourcePermissionInvalid.value = false;
    resourceValidatedProjectId.value = undefined;
    return;
  }
  loading.value = true;
  try {
    if (!(await validateResourceProject(projectId, version))) return;
    const res = await listBuilding({ ...queryParams.value, projectId });
    if (!isCurrentRequest(version, projectId)) return;
    buildingList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    if (isCurrentRequest(version, projectId) && isBusinessPermissionError(error)) {
      await handleBusinessPermissionRevoked(projectId, version);
    }
  } finally {
    if (version === requestVersion) loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

const handleSelectionChange = (selection: BuildingVO[]) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length !== 1;
  multiple.value = selection.length === 0;
};

const handleAdd = () => {
  if (!currentProjectId.value || resourcePermissionInvalid.value) {
    modal.msgWarning('请先选择当前项目');
    return;
  }
  resetForm();
  form.value.projectId = currentProjectId.value;
  dialogProjectId.value = currentProjectId.value;
  openDialog('新增楼栋');
};

const handleUpdate = async (row?: Partial<BuildingVO>) => {
  const id = row?.id ?? ids.value[0];
  const projectId = currentProjectId.value;
  if (!id || !projectId || resourcePermissionInvalid.value) return;
  const version = ++requestVersion;
  resetForm();
  try {
    if (!(await validateResourceProject(projectId, version))) return;
    const res = await getBuilding(id);
    if (!isCurrentRequest(version, projectId)) return;
    Object.assign(form.value, res.data);
    dialogProjectId.value = projectId;
    showDialog('修改楼栋');
  } catch (error) {
    if (isCurrentRequest(version, projectId) && isBusinessPermissionError(error)) {
      await handleBusinessPermissionRevoked(projectId, version);
    }
  }
};

const handleDetail = async (row: Partial<BuildingVO>) => {
  const projectId = currentProjectId.value;
  if (!row.id || !projectId || resourcePermissionInvalid.value) return;
  const version = ++requestVersion;
  try {
    if (!(await validateResourceProject(projectId, version))) return;
    const res = await getBuilding(row.id);
    if (!isCurrentRequest(version, projectId)) return;
    detail.value = res.data;
    detailVisible.value = true;
  } catch (error) {
    if (isCurrentRequest(version, projectId) && isBusinessPermissionError(error)) {
      await handleBusinessPermissionRevoked(projectId, version);
    }
  }
};

const cancel = () => {
  closeDialog();
  resetForm();
  dialogProjectId.value = undefined;
};

const submitForm = () => {
  buildingFormRef.value?.validate(async valid => {
    if (!valid) return;
    if (!currentProjectId.value || String(dialogProjectId.value) !== String(currentProjectId.value)) {
      modal.msgWarning('当前项目已切换，请重新操作');
      cancel();
      return;
    }
    submitLoading.value = true;
    try {
      if (form.value.id) {
        await updateBuilding(form.value);
      } else {
        await addBuilding({ ...form.value, projectId: currentProjectId.value });
      }
      modal.msgSuccess('操作成功');
      cancel();
      await getList();
    } catch (error) {
      await handleOperationPermissionError(error);
    } finally {
      submitLoading.value = false;
    }
  });
};

const handleStatusChange = async (row: Partial<BuildingVO>) => {
  if (!row.id) return;
  const targetStatus = row.status || '1';
  try {
    await modal.confirm(`确认${targetStatus === '0' ? '启用' : '停用'}楼栋“${row.buildingName}”吗？`);
    await changeBuildingStatus({ id: row.id, status: targetStatus });
    modal.msgSuccess('操作成功');
  } catch (error) {
    row.status = targetStatus === '0' ? '1' : '0';
    await handleOperationPermissionError(error);
  }
};

const handleDelete = async (row?: Partial<BuildingVO>) => {
  const buildingIds = row?.id ?? ids.value;
  if (Array.isArray(buildingIds) && buildingIds.length === 0) return;
  await modal.confirm(`确认删除选中的楼栋吗？存在单元或房屋的楼栋将无法删除。`);
  try {
    await delBuilding(buildingIds);
    modal.msgSuccess('删除成功');
    await getList();
  } catch (error) {
    await handleOperationPermissionError(error);
  }
};

const handleExport = () => {
  if (!currentProjectId.value || resourcePermissionInvalid.value) return;
  exportBuilding({ ...queryParams.value, projectId: currentProjectId.value });
};

const stopProjectWatch = watch(currentProjectId, () => {
  invalidateRequests();
  resetProjectState();
  resourcePermissionInvalid.value = false;
  resourceValidatedProjectId.value = undefined;
  queryParams.value.pageNum = 1;
  if (pageActive.value) getList();
});

onMounted(getList);
onActivated(() => {
  pageActive.value = true;
  if (activationCount++ === 0) return;
  if (String(resourceValidatedProjectId.value || '') !== String(currentProjectId.value || '')) {
    resetProjectState();
  }
  getList();
});
onDeactivated(() => {
  pageActive.value = false;
  invalidateRequests();
});
onBeforeUnmount(() => {
  pageActive.value = false;
  invalidateRequests();
  stopProjectWatch();
});
</script>

<style lang="scss" scoped>
.building-page :deep(.el-select) {
  width: 220px;
}

.building-page :deep(.el-input-number) {
  width: 100%;
}
</style>
