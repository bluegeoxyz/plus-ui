<template>
  <div class="p-2 app-container charge-item-page">
    <el-alert v-if="!currentProjectId" title="请先在顶部选择当前物业项目" type="info" :closable="false" show-icon class="mb-2" />
    <el-alert v-else-if="permissionInvalid" title="当前项目的收费访问权限已失效" type="warning" :closable="false" show-icon class="mb-2" />
    <template v-else>
      <el-card v-show="showSearch" shadow="hover" class="mb-2">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item label="所属项目"><el-input :model-value="currentProjectName" disabled /></el-form-item>
          <el-form-item label="收费项目编码" prop="itemCode"><el-input v-model="queryParams.itemCode" clearable @keyup.enter="handleQuery" /></el-form-item>
          <el-form-item label="收费项目名称" prop="itemName"><el-input v-model="queryParams.itemName" clearable @keyup.enter="handleQuery" /></el-form-item>
          <el-form-item label="收费类型" prop="chargeType"><el-select v-model="queryParams.chargeType" clearable><el-option v-for="d in pm_charge_type" :key="d.value" :label="d.label" :value="d.value" /></el-select></el-form-item>
          <el-form-item label="收费分类" prop="chargeCategory"><el-select v-model="queryParams.chargeCategory" clearable><el-option v-for="d in pm_charge_category" :key="d.value" :label="d.label" :value="d.value" /></el-select></el-form-item>
          <el-form-item label="收费载体" prop="chargeObjectType"><el-select v-model="queryParams.chargeObjectType" clearable><el-option v-for="d in pm_charge_object_type" :key="d.value" :label="d.label" :value="d.value" /></el-select></el-form-item>
          <el-form-item label="状态" prop="status"><el-select v-model="queryParams.status" clearable><el-option v-for="d in sys_normal_disable" :key="d.value" :label="d.label" :value="d.value" /></el-select></el-form-item>
          <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="hover">
        <template #header><el-row :gutter="10" class="mb-2">
          <el-col :span="1.5"><el-button v-hasPermi="['property:chargeItem:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button></el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['property:chargeItem:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button></el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['property:chargeItem:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button></el-col>
          <el-col :span="1.5"><el-button v-hasPermi="['property:chargeItem:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button></el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
        </el-row></template>
        <el-table v-loading="loading" border :data="itemList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="所属项目" prop="projectName" min-width="150" show-overflow-tooltip />
          <el-table-column label="收费项目编码" prop="itemCode" min-width="150"><template #default="s"><el-button v-hasPermi="['property:chargeItem:query']" link type="primary" @click="handleDetail(s.row)">{{ s.row.itemCode }}</el-button></template></el-table-column>
          <el-table-column label="收费项目名称" prop="itemName" min-width="160" show-overflow-tooltip />
          <el-table-column label="收费类型" width="110"><template #default="s"><dict-tag :options="pm_charge_type" :value="s.row.chargeType" /></template></el-table-column>
          <el-table-column label="收费分类" width="110"><template #default="s"><dict-tag :options="pm_charge_category" :value="s.row.chargeCategory" /></template></el-table-column>
          <el-table-column label="收费载体" width="110"><template #default="s"><dict-tag :options="pm_charge_object_type" :value="s.row.chargeObjectType" /></template></el-table-column>
          <el-table-column label="状态" width="90" align="center"><template #default="s"><el-switch v-model="s.row.status" v-hasPermi="['property:chargeItem:edit']" active-value="0" inactive-value="1" @change="handleStatusChange(s.row)" /></template></el-table-column>
          <el-table-column label="排序" prop="sort" width="70" align="center" />
          <el-table-column label="更新时间" prop="updateTime" width="170" />
          <el-table-column label="操作" width="150" fixed="right" align="center"><template #default="s">
            <el-button v-hasPermi="['property:chargeItem:query']" link type="primary" icon="View" @click="handleDetail(s.row)" />
            <el-button v-hasPermi="['property:chargeItem:edit']" link type="primary" icon="Edit" @click="handleUpdate(s.row)" />
            <el-button v-hasPermi="['property:chargeItem:remove']" link type="danger" icon="Delete" @click="handleDelete(s.row)" />
          </template></el-table-column>
        </el-table>
        <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
      </el-card>
    </template>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="所属项目" prop="projectId"><el-input :model-value="currentProjectName" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收费项目编码" prop="itemCode"><el-input v-model="form.itemCode" :disabled="!!form.id" maxlength="64" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收费项目名称" prop="itemName"><el-input v-model="form.itemName" maxlength="128" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收费类型" prop="chargeType"><el-select v-model="form.chargeType"><el-option v-for="d in pm_charge_type" :key="d.value" :label="d.label" :value="d.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收费分类" prop="chargeCategory"><el-select v-model="form.chargeCategory"><el-option v-for="d in pm_charge_category" :key="d.value" :label="d.label" :value="d.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收费载体" prop="chargeObjectType"><el-select v-model="form.chargeObjectType"><el-option v-for="d in pm_charge_object_type" :key="d.value" :label="d.label" :value="d.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态" prop="status"><el-radio-group v-model="form.status"><el-radio v-for="d in sys_normal_disable" :key="d.value" :value="d.value">{{ d.label }}</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="排序" prop="sort"><el-input-number v-model="form.sort" :min="0" controls-position="right" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button><el-button @click="cancel">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="收费项目详情" width="680px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="所属项目">{{ detail.projectName }}</el-descriptions-item><el-descriptions-item label="收费项目编码">{{ detail.itemCode }}</el-descriptions-item>
        <el-descriptions-item label="收费项目名称">{{ detail.itemName }}</el-descriptions-item><el-descriptions-item label="收费类型"><dict-tag :options="pm_charge_type" :value="detail.chargeType" /></el-descriptions-item>
        <el-descriptions-item label="收费分类"><dict-tag :options="pm_charge_category" :value="detail.chargeCategory" /></el-descriptions-item><el-descriptions-item label="收费载体"><dict-tag :options="pm_charge_object_type" :value="detail.chargeObjectType" /></el-descriptions-item>
        <el-descriptions-item label="状态"><dict-tag :options="sys_normal_disable" :value="detail.status" /></el-descriptions-item><el-descriptions-item label="排序">{{ detail.sort ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="ChargeItem" lang="ts">
import type { ProjectOptionVO } from '@/api/property/project/types';
import type { ChargeItemForm, ChargeItemQuery, ChargeItemVO } from '@/api/property/charge/item/types';
import { addChargeItem, changeChargeItemStatus, delChargeItem, exportChargeItem, financeProjectOptions, getChargeItem, listChargeItem, updateChargeItem } from '@/api/property/charge/item';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import modal from '@/plugins/modal';
import { useCurrentProjectStore } from '@/store/modules/currentProject';
import { useDict } from '@/utils/dict';

const { pm_charge_type, pm_charge_category, pm_charge_object_type, sys_normal_disable } = toRefs<any>(useDict('pm_charge_type', 'pm_charge_category', 'pm_charge_object_type', 'sys_normal_disable'));
const currentProjectStore = useCurrentProjectStore();
const currentProjectId = computed(() => currentProjectStore.currentProjectId);
const currentProjectName = computed(() => currentProjectStore.currentProjectName);
const itemList = ref<ChargeItemVO[]>([]); const projectOptions = ref<ProjectOptionVO[]>([]); const detail = ref<ChargeItemVO>();
const detailVisible = ref(false); const ids = ref<Array<number | string>>([]); const single = ref(true); const multiple = ref(true);
const total = ref(0); const loading = ref(false); const submitLoading = ref(false); const permissionInvalid = ref(false);
const dialogProjectId = ref<number | string>(); let requestVersion = 0; const { showSearch } = useSearchToggle();
const queryFormRef = ref<ElFormInstance>(); const formRef = ref<ElFormInstance>();
const initForm = (): ChargeItemForm => ({ projectId: undefined, itemCode: '', itemName: '', chargeType: undefined, chargeCategory: undefined, chargeObjectType: undefined, status: '0', sort: 0, remark: '' });
const data = reactive<PageData<ChargeItemForm, ChargeItemQuery>>({ form: initForm(), queryParams: { pageNum: 1, pageSize: 10 }, rules: {
  projectId: [{ required: true, message: '所属项目不能为空', trigger: 'change' }], itemCode: [{ required: true, message: '收费项目编码不能为空', trigger: 'blur' }],
  itemName: [{ required: true, message: '收费项目名称不能为空', trigger: 'blur' }], chargeType: [{ required: true, message: '收费类型不能为空', trigger: 'change' }],
  chargeCategory: [{ required: true, message: '收费分类不能为空', trigger: 'change' }], chargeObjectType: [{ required: true, message: '收费载体不能为空', trigger: 'change' }]
} });
const { queryParams, form, rules } = toRefs(data);
const { dialog, resetForm, showDialog, closeDialog } = useFormDialog({ form, formRef, initialFormData: initForm() });
const active = (v: number, p: number | string) => v === requestVersion && String(currentProjectId.value) === String(p);
const clear = () => { itemList.value = []; total.value = 0; ids.value = []; single.value = true; multiple.value = true; cancel(); detailVisible.value = false; };
const loadProjects = async (p: number | string, v: number) => { const res = await financeProjectOptions(); if (!active(v, p)) return false; projectOptions.value = res.data || []; const ok = projectOptions.value.some(x => String(x.id) === String(p)); permissionInvalid.value = !ok; if (!ok) clear(); return ok; };
const getList = async () => { const p = currentProjectId.value; const v = ++requestVersion; if (!p) { clear(); return; } loading.value = true; try { if (!(await loadProjects(p, v))) return; const res = await listChargeItem({ ...queryParams.value, projectId: p }); if (active(v, p)) { itemList.value = res.data?.rows || []; total.value = res.data?.total || 0; } } finally { if (v === requestVersion) loading.value = false; } };
const handleQuery = () => { queryParams.value.pageNum = 1; getList(); }; const resetQuery = () => { queryFormRef.value?.resetFields(); handleQuery(); };
const handleSelectionChange = (s: ChargeItemVO[]) => { ids.value = s.map(x => x.id); single.value = s.length !== 1; multiple.value = !s.length; };
const handleAdd = () => {
  const projectId = currentProjectId.value;
  if (!projectId || permissionInvalid.value) return modal.msgWarning('请先选择有权限的当前项目');
  resetForm();
  form.value.projectId = projectId;
  dialogProjectId.value = projectId;
  showDialog('新增收费项目');
};
const handleUpdate = async (row?: Partial<ChargeItemVO>) => { const id = row?.id ?? ids.value[0], p = currentProjectId.value; if (!id || !p) return; const v = ++requestVersion; const res = await getChargeItem(id); if (!active(v, p)) return; resetForm(); Object.assign(form.value, res.data); dialogProjectId.value = p; showDialog('修改收费项目'); };
const handleDetail = async (row: Partial<ChargeItemVO>) => { const p = currentProjectId.value; if (!p || !row.id) return; const v = ++requestVersion; const res = await getChargeItem(row.id); if (active(v, p)) { detail.value = res.data; detailVisible.value = true; } };
function cancel() { closeDialog(); resetForm(); dialogProjectId.value = undefined; }
const submitForm = async () => {
  const projectId = currentProjectId.value;
  if (!projectId || String(dialogProjectId.value) !== String(projectId)) {
    modal.msgWarning('当前项目无效，请重新选择项目');
    cancel();
    return;
  }
  if (!form.value.projectId) form.value.projectId = projectId;
  if (String(form.value.projectId) !== String(projectId)) {
    modal.msgWarning('当前项目已切换，请重新操作');
    cancel();
    return;
  }
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitLoading.value = true;
  try {
    if (form.value.id) {
      await updateChargeItem(form.value);
    } else {
      await addChargeItem({ ...form.value, projectId: form.value.projectId });
    }
    modal.msgSuccess('操作成功');
    cancel();
    await getList();
  } finally {
    submitLoading.value = false;
  }
};
const handleStatusChange = async (row: Partial<ChargeItemVO>) => { if (!row.id) return; const target = row.status || '1'; try { await modal.confirm(`确认${target === '0' ? '启用' : '停用'}收费项目“${row.itemName || ''}”吗？`); await changeChargeItemStatus({ id: row.id, status: target }); modal.msgSuccess('操作成功'); } catch { row.status = target === '0' ? '1' : '0'; } };
const handleDelete = async (row?: Partial<ChargeItemVO>) => { const values = row?.id ?? ids.value; await modal.confirm('确认删除选中的收费项目吗？'); await delChargeItem(values); modal.msgSuccess('删除成功'); await getList(); };
const handleExport = () => currentProjectId.value && exportChargeItem({ ...queryParams.value, projectId: currentProjectId.value });
watch(currentProjectId, () => { requestVersion++; permissionInvalid.value = false; clear(); queryParams.value.pageNum = 1; getList(); });
onMounted(getList); onBeforeUnmount(() => { requestVersion++; });
</script>

<style lang="scss" scoped>.charge-item-page :deep(.el-select) { width: 210px; } .charge-item-page :deep(.el-input-number) { width: 100%; }</style>
