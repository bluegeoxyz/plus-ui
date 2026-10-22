<template>
  <div class="p-2 app-container unit-page">
    <el-alert v-if="!currentProjectId" title="请先在顶部选择当前物业项目" type="info" :closable="false" show-icon class="mb-2" />
    <el-alert
      v-else-if="resourcePermissionInvalid"
      title="当前项目的单元访问权限已失效"
      description="请重新选择一个具有 RESOURCE 业务访问权限的项目。"
      type="warning"
      :closable="false"
      show-icon
      class="mb-2"
    />

    <template v-else>
      <el-card v-show="showSearch" shadow="hover" class="mb-2">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item label="所属楼栋" prop="buildingId">
            <el-select v-model="queryParams.buildingId" clearable filterable placeholder="请选择楼栋" @change="handleQuery">
              <el-option v-for="item in buildingOptionList" :key="item.id" :label="buildingOptionLabel(item)" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="单元编码" prop="unitCode">
            <el-input v-model="queryParams.unitCode" clearable placeholder="请输入单元编码" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="单元名称" prop="unitName">
            <el-input v-model="queryParams.unitName" clearable placeholder="请输入单元名称" @keyup.enter="handleQuery" />
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
            <el-col :span="1.5"><el-button v-hasPermi="['property:unit:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button></el-col>
            <el-col :span="1.5"><el-button v-hasPermi="['property:unit:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button></el-col>
            <el-col :span="1.5"><el-button v-hasPermi="['property:unit:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button></el-col>
            <el-col :span="1.5"><el-button v-hasPermi="['property:unit:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button></el-col>
            <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
          </el-row>
        </template>

        <el-table v-loading="loading" border :data="unitList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="所属楼栋" min-width="160" show-overflow-tooltip>
            <template #default="scope">{{ buildingLabel(scope.row.buildingId) }}</template>
          </el-table-column>
          <el-table-column label="单元编码" prop="unitCode" min-width="120">
            <template #default="scope"><el-button v-hasPermi="['property:unit:query']" link type="primary" @click="handleDetail(scope.row)">{{ scope.row.unitCode }}</el-button></template>
          </el-table-column>
          <el-table-column label="单元名称" prop="unitName" min-width="140" show-overflow-tooltip />
          <el-table-column label="楼层数" prop="floorCount" width="90" align="center" />
          <el-table-column label="排序" prop="sort" width="80" align="center" />
          <el-table-column label="状态" prop="status" width="90" align="center">
            <template #default="scope"><el-switch v-model="scope.row.status" v-hasPermi="['property:unit:edit']" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)" /></template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template #default="scope">
              <el-button v-hasPermi="['property:unit:query']" link type="primary" icon="View" @click="handleDetail(scope.row)" />
              <el-button v-hasPermi="['property:unit:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)" />
              <el-button v-hasPermi="['property:unit:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)" />
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
      </el-card>
    </template>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" append-to-body>
      <el-form ref="unitFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属楼栋" prop="buildingId">
              <el-select v-model="form.buildingId" filterable placeholder="请选择楼栋" :disabled="Boolean(form.id)">
                <el-option v-for="item in buildingOptionList" :key="item.id" :label="buildingOptionLabel(item)" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="单元编码" prop="unitCode"><el-input v-model="form.unitCode" maxlength="32" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="单元名称" prop="unitName"><el-input v-model="form.unitName" maxlength="64" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="楼层数" prop="floorCount"><el-input-number v-model="form.floorCount" :min="0" controls-position="right" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="显示顺序" prop="sort"><el-input-number v-model="form.sort" :min="0" controls-position="right" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态" prop="status"><el-radio-group v-model="form.status"><el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label }}</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button><el-button @click="cancel">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="单元详情" width="620px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="所属楼栋">{{ buildingLabel(detail.buildingId) }}</el-descriptions-item>
        <el-descriptions-item label="单元编码">{{ detail.unitCode }}</el-descriptions-item>
        <el-descriptions-item label="单元名称">{{ detail.unitName }}</el-descriptions-item>
        <el-descriptions-item label="楼层数">{{ detail.floorCount ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="显示顺序">{{ detail.sort ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="sys_normal_disable" :value="detail.status" /></el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="BuildingUnit" lang="ts">
import { buildingOptions, resourceProjectOptions } from '@/api/property/resource/building';
import type { BuildingOptionVO } from '@/api/property/resource/building/types';
import { addBuildingUnit, changeBuildingUnitStatus, delBuildingUnit, exportBuildingUnit, getBuildingUnit, listBuildingUnit, updateBuildingUnit } from '@/api/property/resource/unit';
import type { BuildingUnitForm, BuildingUnitQuery, BuildingUnitVO } from '@/api/property/resource/unit/types';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import modal from '@/plugins/modal';
import { useCurrentProjectStore } from '@/store/modules/currentProject';
import { useDict } from '@/utils/dict';

const { sys_normal_disable } = toRefs<any>(useDict('sys_normal_disable'));

const currentProjectStore = useCurrentProjectStore();
const currentProjectId = computed(() => currentProjectStore.currentProjectId);
const unitList = ref<BuildingUnitVO[]>([]);
const buildingOptionList = ref<BuildingOptionVO[]>([]);
const detail = ref<BuildingUnitVO>();
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
const unitFormRef = ref<ElFormInstance>();

const initFormData = (): BuildingUnitForm => ({ id: undefined, projectId: undefined, buildingId: undefined, unitCode: '', unitName: '', floorCount: undefined, sort: 0, status: '0', remark: '' });
const data = reactive<PageData<BuildingUnitForm, BuildingUnitQuery>>({
  form: initFormData(),
  queryParams: { pageNum: 1, pageSize: 10, projectId: undefined, buildingId: undefined, unitCode: undefined, unitName: undefined, status: undefined },
  rules: {
    buildingId: [{ required: true, message: '所属楼栋不能为空', trigger: 'change' }],
    unitCode: [{ required: true, message: '单元编码不能为空', trigger: 'blur' }, { max: 32, message: '单元编码长度不能超过32个字符', trigger: 'blur' }],
    unitName: [{ required: true, message: '单元名称不能为空', trigger: 'blur' }, { max: 64, message: '单元名称长度不能超过64个字符', trigger: 'blur' }]
  }
});
const { queryParams, form, rules } = toRefs(data);
const { dialog, resetForm, openDialog, showDialog, closeDialog } = useFormDialog({ form, formRef: unitFormRef, initialFormData: initFormData() });

const buildingDisplayName = (item?: BuildingOptionVO) => item?.buildingName?.trim() || item?.buildingCode?.trim() || '-';
const buildingOptionLabel = (item: BuildingOptionVO) => {
  const duplicate = Boolean(item.buildingName?.trim()) && buildingOptionList.value.filter(option => option.buildingName?.trim() === item.buildingName.trim()).length > 1;
  return duplicate && item.buildingCode?.trim() ? `${buildingDisplayName(item)}（${item.buildingCode.trim()}）` : buildingDisplayName(item);
};
const buildingLabel = (id: number | string) => {
  const item = buildingOptionList.value.find(option => String(option.id) === String(id));
  return buildingDisplayName(item);
};
const clearList = () => { unitList.value = []; total.value = 0; ids.value = []; single.value = true; multiple.value = true; };
const cancel = () => { closeDialog(); resetForm(); dialogProjectId.value = undefined; };
const resetProjectState = () => { clearList(); buildingOptionList.value = []; queryParams.value.buildingId = undefined; cancel(); detail.value = undefined; detailVisible.value = false; };
const invalidateRequests = () => { requestVersion += 1; loading.value = false; };
const isCurrentRequest = (version: number, projectId: number | string) => pageActive.value && version === requestVersion && String(currentProjectId.value) === String(projectId);
const isBusinessPermissionError = (error: unknown) => error instanceof Error && error.message.includes('无项目业务访问权限');

const validateResourceProject = async (projectId: number | string, version: number) => {
  const res = await resourceProjectOptions();
  if (!isCurrentRequest(version, projectId)) return false;
  const allowed = (res.data || []).some(project => String(project.id) === String(projectId));
  resourceValidatedProjectId.value = allowed ? projectId : undefined;
  resourcePermissionInvalid.value = !allowed;
  if (!allowed) resetProjectState();
  return allowed;
};
const loadBuildingOptions = async (projectId: number | string, version: number) => {
  const res = await buildingOptions({ projectId });
  if (!isCurrentRequest(version, projectId)) return false;
  buildingOptionList.value = res.data || [];
  return true;
};
const handlePermissionRevoked = async (projectId: number | string, version: number) => {
  resetProjectState();
  try {
    const allowed = await validateResourceProject(projectId, version);
    if (isCurrentRequest(version, projectId) && !allowed) modal.msgWarning('当前项目的单元访问权限已失效，请重新选择项目');
  } catch { /* 网络异常不解释为权限撤销 */ }
};
const handleOperationError = async (error: unknown) => {
  const projectId = currentProjectId.value;
  if (!projectId || !isBusinessPermissionError(error)) return;
  await handlePermissionRevoked(projectId, ++requestVersion);
};

const getList = async () => {
  const projectId = currentProjectId.value;
  const version = ++requestVersion;
  if (!projectId) { resetProjectState(); resourcePermissionInvalid.value = false; resourceValidatedProjectId.value = undefined; return; }
  loading.value = true;
  try {
    if (!(await validateResourceProject(projectId, version))) return;
    if (!(await loadBuildingOptions(projectId, version))) return;
    const res = await listBuildingUnit({ ...queryParams.value, projectId });
    if (!isCurrentRequest(version, projectId)) return;
    unitList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  } catch (error) {
    if (isCurrentRequest(version, projectId) && isBusinessPermissionError(error)) await handlePermissionRevoked(projectId, version);
  } finally { if (version === requestVersion) loading.value = false; }
};
const handleQuery = () => { queryParams.value.pageNum = 1; getList(); };
const resetQuery = () => { queryFormRef.value?.resetFields(); handleQuery(); };
const handleSelectionChange = (selection: BuildingUnitVO[]) => { ids.value = selection.map(item => item.id); single.value = selection.length !== 1; multiple.value = selection.length === 0; };

const handleAdd = () => {
  if (!currentProjectId.value || resourcePermissionInvalid.value) return modal.msgWarning('请先选择具有资源权限的当前项目');
  if (!buildingOptionList.value.length) return modal.msgWarning('当前项目没有可用楼栋');
  resetForm(); form.value.projectId = currentProjectId.value; dialogProjectId.value = currentProjectId.value; openDialog('新增单元');
};
const loadDetail = async (id: number | string, mode: 'edit' | 'detail') => {
  const projectId = currentProjectId.value;
  if (!projectId || resourcePermissionInvalid.value) return;
  const version = ++requestVersion;
  try {
    if (!(await validateResourceProject(projectId, version))) return;
    if (!(await loadBuildingOptions(projectId, version))) return;
    const res = await getBuildingUnit(id);
    if (!isCurrentRequest(version, projectId)) return;
    if (mode === 'edit') { resetForm(); Object.assign(form.value, res.data); dialogProjectId.value = projectId; showDialog('修改单元'); }
    else { detail.value = res.data; detailVisible.value = true; }
  } catch (error) { if (isCurrentRequest(version, projectId) && isBusinessPermissionError(error)) await handlePermissionRevoked(projectId, version); }
};
const handleUpdate = (row?: Partial<BuildingUnitVO>) => { const id = row?.id ?? ids.value[0]; if (id) loadDetail(id, 'edit'); };
const handleDetail = (row: Partial<BuildingUnitVO>) => { if (row.id) loadDetail(row.id, 'detail'); };

const submitForm = () => unitFormRef.value?.validate(async valid => {
  if (!valid) return;
  if (!currentProjectId.value || String(dialogProjectId.value) !== String(currentProjectId.value)) { modal.msgWarning('当前项目已切换，请重新操作'); cancel(); return; }
  submitLoading.value = true;
  try {
    if (form.value.id) await updateBuildingUnit(form.value);
    else await addBuildingUnit({ ...form.value, projectId: currentProjectId.value });
    modal.msgSuccess('操作成功'); cancel(); await getList();
  } catch (error) { await handleOperationError(error); } finally { submitLoading.value = false; }
});
const handleStatusChange = async (row: Partial<BuildingUnitVO>) => {
  if (!row.id) return;
  const target = row.status || '1';
  try { await modal.confirm(`确认${target === '0' ? '启用' : '停用'}单元“${row.unitName}”吗？`); await changeBuildingUnitStatus({ id: row.id, status: target }); modal.msgSuccess('操作成功'); }
  catch (error) { row.status = target === '0' ? '1' : '0'; await handleOperationError(error); }
};
const handleDelete = async (row?: Partial<BuildingUnitVO>) => {
  const targetIds = row?.id ?? ids.value;
  if (Array.isArray(targetIds) && !targetIds.length) return;
  await modal.confirm('确认删除选中的单元吗？存在房屋的单元无法删除。');
  try { await delBuildingUnit(targetIds); modal.msgSuccess('删除成功'); await getList(); } catch (error) { await handleOperationError(error); }
};
const handleExport = () => { if (currentProjectId.value && !resourcePermissionInvalid.value) exportBuildingUnit({ ...queryParams.value, projectId: currentProjectId.value }); };

const stopProjectWatch = watch(currentProjectId, () => {
  invalidateRequests(); resetProjectState(); resourcePermissionInvalid.value = false; resourceValidatedProjectId.value = undefined; queryParams.value.pageNum = 1;
  if (pageActive.value) getList();
});
onMounted(getList);
onActivated(() => { pageActive.value = true; if (activationCount++ === 0) return; if (String(resourceValidatedProjectId.value || '') !== String(currentProjectId.value || '')) resetProjectState(); getList(); });
onDeactivated(() => { pageActive.value = false; invalidateRequests(); });
onBeforeUnmount(() => { pageActive.value = false; invalidateRequests(); stopProjectWatch(); });
</script>

<style lang="scss" scoped>
.unit-page :deep(.el-select) { width: 220px; }
.unit-page :deep(.el-input-number) { width: 100%; }
</style>
